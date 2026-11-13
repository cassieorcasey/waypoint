Catatan ini mengikuti dua langkah di checklist. **CI** (*Continuous Integration*) menjalankan pengujian otomatis setiap ada perubahan, sehingga masalah tertangkap sebelum digabung. **CD** (*Continuous Delivery/Deployment*) mengotomatiskan rilis setelah semua pengujian lulus. Di ML, yang diuji bukan hanya kode, tapi juga **data** dan **model**.

## 1. Automasi pengujian model

Tiga lapis pengujian untuk proyek ML:

| Lapis | Menguji | Contoh |
|---|---|---|
| Kode | Fungsi preprocessing, fitur, API | Fungsi pembersih teks menangani string kosong |
| Data | Skema dan kualitas data input | Kolom wajib ada, umur 0–120, tidak ada ID duplikat |
| Model | Perilaku dan kualitas model | AUC ≥ ambang, tidak lebih buruk dari model produksi, prediksi masuk akal |

Contoh dengan `pytest`:

```python
# tests/test_model.py
import joblib
import numpy as np
import pandas as pd
import pytest
from sklearn.datasets import load_breast_cancer
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

AMBANG_AUC = 0.95

@pytest.fixture(scope="session")
def data():
    # Di proyek nyata, set uji ini harus data yang TIDAK dipakai saat training (misalnya snapshot terpisah),
    # supaya ambang performa tidak diukur dari data yang sudah dilihat model.
    d = load_breast_cancer(as_frame=True)
    return train_test_split(d.data, d.target, test_size=0.2, random_state=0, stratify=d.target)

@pytest.fixture(scope="session")
def model():
    return joblib.load("model.joblib")["model"]

def test_skema_data(data):
    X_tr, X_te, _, _ = data
    assert list(X_tr.columns) == list(X_te.columns)
    assert not X_tr.isna().any().any(), "ada nilai kosong di data latih"

def test_performa_minimum(model, data):
    _, X_te, _, y_te = data
    auc = roc_auc_score(y_te, model.predict_proba(X_te)[:, 1])
    assert auc >= AMBANG_AUC, f"AUC {auc:.3f} di bawah ambang {AMBANG_AUC}"

def test_bentuk_dan_rentang_keluaran(model, data):
    _, X_te, _, _ = data
    p = model.predict_proba(X_te.head(5))
    assert p.shape == (5, 2) and np.allclose(p.sum(axis=1), 1)

def test_invariansi_urutan_baris(model, data):
    _, X_te, _, _ = data
    sampel = X_te.head(20)
    asli = model.predict_proba(sampel)[:, 1]
    acak = model.predict_proba(sampel.iloc[::-1])[:, 1][::-1]
    assert np.allclose(asli, acak), "prediksi bergantung pada urutan baris"

def test_arah_masuk_akal(model, data):
    # uji arah: tumor yang lebih besar seharusnya tidak membuat peluang jinak naik
    _, X_te, _, _ = data
    baris = X_te.head(1)
    lebih_besar = baris.copy()
    lebih_besar[["mean radius", "worst radius", "mean area", "worst area"]] *= 1.5
    assert model.predict_proba(lebih_besar)[0, 1] <= model.predict_proba(baris)[0, 1] + 1e-9
```

Jenis uji perilaku model yang berguna:

- **Ambang minimum**: metrik utama tidak boleh di bawah batas yang disepakati.
- **Tidak mundur** (*regression test*): model baru tidak boleh lebih buruk dari model produksi pada set evaluasi yang sama.
- **Invariansi**: perubahan yang seharusnya tidak berpengaruh (urutan baris, huruf besar/kecil nama) tidak mengubah prediksi.
- **Arah** (*directional expectation*): perubahan tertentu harus menggeser prediksi ke arah yang masuk akal.
- **Irisan data** (*slice*): performa per kelompok penting (wilayah, perangkat, kelompok umur) tidak boleh jauh di bawah rata-rata.

Untuk validasi data yang lebih lengkap, library seperti `pandera` atau Great Expectations mendefinisikan skema dan aturan sebagai kode.

## 2. Automasi deployment via GitHub Actions

GitHub Actions menjalankan *workflow* (file YAML di `.github/workflows/`) saat terjadi peristiwa tertentu, misalnya pull request dibuka atau commit masuk ke `main`.

Workflow CI yang menjalankan tes di setiap pull request:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip
      - run: pip install -r requirements.txt pytest ruff
      - run: ruff check .                  # gaya dan bug sederhana
      - run: python train.py                # latih ulang model kecil, menghasilkan model.joblib
      - run: pytest -q                      # uji kode, data, dan model
```

Workflow CD yang membangun image Docker dan men-deploy hanya jika tes lulus di `main`:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    uses: ./.github/workflows/ci.yml       # pakai ulang workflow CI (beri ci.yml pemicu workflow_call)

  deploy:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
      - name: Picu deploy
        run: curl -fsS -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}"
```

Agar `uses: ./.github/workflows/ci.yml` bisa dipanggil, tambahkan `workflow_call:` ke bagian `on:` di `ci.yml`. Langkah "Picu deploy" bergantung pada platform: Render menyediakan *deploy hook* URL, Hugging Face Spaces cukup dengan `git push` ke repo Space, dan AWS memakai `aws-actions` untuk ECR dan App Runner.

Praktik penting:

- **Rahasia** (token, API key) disimpan di *Settings → Secrets and variables → Actions*, dipanggil dengan `${{ secrets.NAMA }}`, dan tidak pernah ditulis di kode.
- **Tag image dengan hash commit** (`github.sha`), sehingga setiap versi di produksi bisa dilacak ke kode persisnya dan bisa dikembalikan.
- **Lindungi branch `main`**: wajib lulus CI dan review sebelum merge.
- **Pisahkan latih ulang model besar dari CI.** Training yang memakan jam dijalankan sebagai pipeline terjadwal terpisah (atau di platform ML), lalu menghasilkan model yang didaftarkan di registry. CI cukup menguji kode dengan data kecil dan memvalidasi model dari registry.
- **Deploy bertahap** untuk model penting: *shadow mode* (model baru ikut memprediksi tanpa dipakai), lalu *canary* (sebagian kecil trafik), baru penuh.

## Latihan

1. Tulis lima tes `pytest` untuk proyek ML-mu: satu uji kode, satu uji skema data, satu ambang performa, satu invariansi, satu uji arah.
2. Tambahkan workflow CI di repo GitHub-mu dan buka pull request yang sengaja menurunkan performa model. Pastikan CI gagal.
3. Tambahkan uji *slice*: AUC per kelompok tidak boleh kurang dari 0,05 di bawah AUC keseluruhan.
4. Buat workflow yang membangun image Docker dan mendorongnya ke GitHub Container Registry dengan tag hash commit.
5. Sambungkan deploy otomatis ke Render atau Hugging Face Spaces, lalu latih *rollback* ke tag sebelumnya.
