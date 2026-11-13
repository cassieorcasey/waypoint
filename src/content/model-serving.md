Catatan ini mengikuti dua langkah di checklist. Model di notebook belum memberi nilai sampai bisa dipakai sistem lain. *Model serving* adalah membuat model menjawab permintaan prediksi secara andal: dari aplikasi, dashboard, atau layanan lain.

## 1. Mengubah model menjadi fungsi prediksi

Langkah pertama adalah memisahkan **training** dari **inference**. Hasil training disimpan sebagai satu artefak, lalu kode inference cukup memuat artefak itu dan memanggil `predict`.

Simpan seluruh **pipeline**, bukan hanya model. Preprocessing (imputasi, scaling, encoding) harus ikut, supaya data baru diproses persis seperti saat training.

```python
# train.py
import joblib
from sklearn.datasets import load_breast_cancer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

data = load_breast_cancer(as_frame=True)
X, y = data.data, data.target
pipeline = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(X, y)

joblib.dump({"model": pipeline, "fitur": list(X.columns), "versi": "1.0.0"}, "model.joblib")
```

Fungsi prediksi yang baik memenuhi empat hal: **memvalidasi input**, **mengurutkan fitur** sesuai saat training, mengembalikan **struktur jelas** (bukan array mentah), dan menyertakan **versi model**.

```python
# predict.py
import joblib
import pandas as pd

_artefak = joblib.load("model.joblib")       # dimuat sekali saat program mulai, bukan per permintaan

def prediksi(baris: list[dict]) -> list[dict]:
    fitur = _artefak["fitur"]
    df = pd.DataFrame(baris)
    hilang = set(fitur) - set(df.columns)
    if hilang:
        raise ValueError(f"fitur hilang: {sorted(hilang)[:5]}")
    proba = _artefak["model"].predict_proba(df[fitur])[:, 1]
    return [
        {"peluang_jinak": round(float(p), 4), "label": "jinak" if p >= 0.5 else "ganas", "versi_model": _artefak["versi"]}
        for p in proba
    ]
```

Catatan penting:

- **Versi library harus sama.** Model joblib/pickle dari scikit-learn versi tertentu bisa gagal dimuat atau berperilaku lain di versi berbeda. Kunci versi di `requirements.txt`.
- **Pickle bisa menjalankan kode** saat dimuat. Jangan pernah memuat file model dari sumber yang tidak dipercaya.
- Untuk portabilitas antarbahasa, model bisa diekspor ke **ONNX**. Untuk PyTorch, simpan `state_dict` atau gunakan `torch.export`.
- **Batch atau real-time?** Kalau prediksi cukup dihitung sekali sehari (skor churn semua pelanggan), jalankan skrip batch terjadwal dan simpan hasilnya ke database. API real-time hanya perlu jika prediksi dibutuhkan saat itu juga.

## 2. Membungkus model jadi REST API dengan FastAPI atau Flask

**FastAPI** adalah pilihan utama untuk API Python modern: validasi input otomatis dari type hint (lewat Pydantic), dokumentasi interaktif otomatis di `/docs`, dan cepat.

```python
# app.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import joblib
import pandas as pd

artefak = joblib.load("model.joblib")
app = FastAPI(title="API Diagnosis", version=artefak["versi"])

class Permintaan(BaseModel):
    pasien: list[dict[str, float]] = Field(..., min_length=1, max_length=1000)

class Hasil(BaseModel):
    peluang_jinak: float
    label: str
    versi_model: str

@app.get("/health")
def health():
    return {"status": "ok", "versi_model": artefak["versi"]}

@app.post("/predict", response_model=list[Hasil])
def predict(req: Permintaan):
    df = pd.DataFrame(req.pasien)
    hilang = set(artefak["fitur"]) - set(df.columns)
    if hilang:
        raise HTTPException(status_code=422, detail=f"fitur hilang: {sorted(hilang)[:5]}")
    proba = artefak["model"].predict_proba(df[artefak["fitur"]])[:, 1]
    return [Hasil(peluang_jinak=round(float(p), 4), label="jinak" if p >= 0.5 else "ganas",
                  versi_model=artefak["versi"]) for p in proba]
```

```bash
pip install fastapi uvicorn joblib scikit-learn pandas
uvicorn app:app --reload --port 8000        # buka http://localhost:8000/docs

curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"pasien": [{"mean radius": 14.1, "mean texture": 19.3}]}'
```

Permintaan contoh di atas sengaja kurang fitur, sehingga API menjawab `422` dengan pesan yang jelas. Itu perilaku yang benar: lebih baik menolak daripada memprediksi dari data yang tidak lengkap.

Alternatif dengan **Flask**, lebih sederhana tapi validasinya harus ditulis sendiri:

```python
from flask import Flask, request, jsonify
from predict import prediksi

app = Flask(__name__)

@app.post("/predict")
def predict():
    try:
        return jsonify(prediksi(request.get_json()["pasien"]))
    except (KeyError, ValueError) as e:
        return jsonify({"error": str(e)}), 422
```

Daftar periksa API model yang siap produksi:

| Aspek | Praktik |
|---|---|
| Kontrak | Skema input/output jelas, versi model di setiap respons |
| Kesehatan | Endpoint `/health` untuk load balancer dan monitoring |
| Kinerja | Model dimuat sekali saat start; dukung prediksi batch dalam satu permintaan |
| Keamanan | Batasi ukuran permintaan, autentikasi (API key atau token) bila publik |
| Observabilitas | Log input (tanpa data pribadi), prediksi, dan latensi untuk monitoring di Fase 8 |
| Pengujian | Tes otomatis dengan `TestClient` dari FastAPI |

```python
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_health():
    assert client.get("/health").json()["status"] == "ok"

def test_fitur_hilang_ditolak():
    assert client.post("/predict", json={"pasien": [{"mean radius": 1.0}]}).status_code == 422
```

## Latihan

1. Simpan pipeline dari proyek Fase 4 milikmu dengan joblib, lalu muat di proses Python baru dan pastikan prediksinya identik.
2. Bangun API FastAPI dengan endpoint `/health` dan `/predict`, lalu coba semuanya lewat halaman `/docs`.
3. Tambahkan validasi rentang nilai (misalnya umur 0–120) dengan `Field(ge=0, le=120)` pada model Pydantic per baris.
4. Tulis tiga tes otomatis dengan `TestClient`: sukses, fitur hilang, dan batch berisi 100 baris.
5. Ukur latensi rata-rata dan p95 untuk 1.000 permintaan berturut-turut.
