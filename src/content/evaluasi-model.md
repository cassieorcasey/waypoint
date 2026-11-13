Catatan ini mengikuti enam langkah di checklist. Model hanya sebaik cara kita mengukurnya. Metrik yang salah atau cara pembagian data yang bocor membuat model terlihat bagus di laptop lalu gagal di produksi.

```python
import numpy as np
from sklearn import metrics
```

## 1. Metrik regresi: MSE, RMSE, MAE, R squared

| Metrik | Rumus | Satuan | Sifat |
|---|---|---|---|
| MAE | rata-rata `abs(y - ŷ)` | sama dengan y | Mudah dijelaskan, tahan outlier |
| MSE | rata-rata `(y - ŷ)²` | kuadrat y | Menghukum error besar lebih berat |
| RMSE | akar MSE | sama dengan y | Seperti MSE, tapi bisa dibaca |
| R² | `1 - SSE/SST` | tanpa satuan | Porsi variasi yang dijelaskan model |

```python
y    = np.array([100, 150, 200, 250, 300])
yhat = np.array([110, 140, 210, 240, 400])     # satu prediksi meleset jauh

print(metrics.mean_absolute_error(y, yhat))           # 28.0
print(metrics.mean_squared_error(y, yhat))            # 2080.0
print(round(np.sqrt(metrics.mean_squared_error(y, yhat)), 1))   # 45.6
print(round(metrics.r2_score(y, yhat), 3))            # 0.584
```

Satu error 100 membuat RMSE jauh di atas MAE. Kalau satu kesalahan besar sangat mahal (misalnya stok kosong), optimasi RMSE. Kalau semua kesalahan sama mahalnya, MAE lebih jujur.

R² = 1 berarti sempurna, 0 berarti sama saja dengan menebak rata-rata, dan **bisa negatif** jika model lebih buruk dari rata-rata. Untuk target dengan rentang sangat lebar (harga rumah), pertimbangkan MAPE atau error pada skala log.

## 2. Metrik klasifikasi: Accuracy, Precision, Recall, F1

Empat sel dasar: **TP** (positif tertebak positif), **FP** (negatif tertebak positif, alarm palsu), **FN** (positif terlewat), **TN**.

| Metrik | Rumus | Menjawab |
|---|---|---|
| Accuracy | `(TP + TN) / semua` | Berapa persen tebakan benar? |
| Precision | `TP / (TP + FP)` | Dari yang ditebak positif, berapa yang benar? |
| Recall | `TP / (TP + FN)` | Dari yang benar-benar positif, berapa yang tertangkap? |
| F1 | rata-rata harmonik precision dan recall | Keseimbangan keduanya |

```python
y_true = np.array([0, 0, 0, 0, 0, 0, 0, 1, 1, 1])
y_pred = np.array([0, 0, 0, 0, 0, 1, 0, 1, 1, 0])

print(metrics.accuracy_score(y_true, y_pred))     # 0.8
print(metrics.precision_score(y_true, y_pred))    # 0.667 (2 dari 3 tebakan positif benar)
print(metrics.recall_score(y_true, y_pred))       # 0.667 (2 dari 3 kasus positif tertangkap)
print(metrics.classification_report(y_true, y_pred, digits=3))
```

**Jebakan accuracy** pada data tidak seimbang: jika hanya 1% transaksi adalah penipuan, model yang selalu menebak "aman" punya akurasi 99% dan sama sekali tidak berguna.

Pilih metrik dari **biaya kesalahan**:

- FN mahal (penyakit terlewat, penipuan lolos): utamakan **recall**.
- FP mahal (email penting masuk spam, pelanggan baik diblokir): utamakan **precision**.
- Keduanya penting: F1, atau F-beta untuk memberi bobot.

## 3. Confusion Matrix dan ROC-AUC

```python
print(metrics.confusion_matrix(y_true, y_pred))
# [[6 1]     baris = kelas sebenarnya, kolom = tebakan
#  [1 2]]
```

Precision dan recall bergantung pada **ambang** (biasanya 0,5). Kurva **ROC** memplot *true positive rate* (recall) terhadap *false positive rate* untuk semua ambang. **AUC** (luas di bawah kurva) adalah peluang model memberi skor lebih tinggi ke contoh positif acak daripada ke contoh negatif acak: 0,5 = menebak acak, 1,0 = sempurna.

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

X, y = load_breast_cancer(return_X_y=True)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=0, stratify=y)
model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(X_tr, y_tr)
skor = model.predict_proba(X_te)[:, 1]

print(round(metrics.roc_auc_score(y_te, skor), 3))
print(round(metrics.average_precision_score(y_te, skor), 3))   # luas kurva precision-recall
fpr, tpr, ambang = metrics.roc_curve(y_te, skor)
```

Untuk data **sangat tidak seimbang**, kurva **precision-recall** dan *average precision* lebih informatif daripada ROC, karena ROC bisa tampak bagus hanya karena jumlah negatif yang sangat banyak. Setelah memilih model berdasarkan AUC, tetap tentukan ambang operasional berdasarkan biaya FP dan FN.

## 4. K-Fold Cross Validation

Satu kali pembagian train/test itu bergantung keberuntungan. K-Fold membagi data menjadi `k` bagian; model dilatih `k` kali, setiap kali satu bagian berbeda menjadi data validasi. Hasilnya rata-rata **dan** sebaran skor.

```python
from sklearn.model_selection import cross_val_score, StratifiedKFold

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)
skor_cv = cross_val_score(model, X_tr, y_tr, cv=cv, scoring="roc_auc")
print(round(skor_cv.mean(), 3), "±", round(skor_cv.std(), 3))
```

Pilih jenis pembagian sesuai data:

| Pembagian | Kapan |
|---|---|
| `StratifiedKFold` | Klasifikasi; menjaga proporsi kelas di tiap fold |
| `GroupKFold` | Banyak baris dari subjek yang sama (pasien, pelanggan); satu subjek tidak boleh ada di train dan validasi sekaligus |
| `TimeSeriesSplit` | Data waktu; selalu latih dengan masa lalu, uji dengan masa depan |

> **Penting:** semua preprocessing (imputasi, scaling, encoding, seleksi fitur) harus berada **di dalam pipeline** yang di-cross-validate. Kalau scaler di-fit ke seluruh data sebelum CV, informasi dari fold validasi bocor ke training dan skornya terlalu optimis.

## 5. Bias variance tradeoff

Error prediksi berasal dari tiga sumber: **bias** (model terlalu sederhana dan meleset secara sistematis), **varians** (model terlalu sensitif terhadap data latih tertentu), dan noise yang tidak bisa dihilangkan.

| Gejala | Diagnosis | Solusi |
|---|---|---|
| Train jelek, validasi jelek | Bias tinggi (*underfit*) | Model lebih kompleks, fitur lebih baik, regularisasi dikurangi |
| Train bagus, validasi jauh lebih jelek | Varians tinggi (*overfit*) | Data lebih banyak, regularisasi, model lebih sederhana, ensembel |
| Keduanya bagus dan dekat | Seimbang | Selesai, cek di data uji |

Alat diagnosisnya adalah **kurva validasi** (skor terhadap kompleksitas model) dan **kurva belajar** (skor terhadap jumlah data):

```python
from sklearn.model_selection import validation_curve
from sklearn.tree import DecisionTreeClassifier

kedalaman = np.arange(1, 15)
tr, va = validation_curve(DecisionTreeClassifier(random_state=0), X_tr, y_tr,
                          param_name="max_depth", param_range=kedalaman, cv=5)
for d, a, b in zip(kedalaman, tr.mean(1), va.mean(1)):
    print(d, round(a, 3), round(b, 3))   # train naik sampai 1.0, validasi mentok ~0.93 sejak kedalaman 2
```

Kalau kurva belajar menunjukkan skor validasi masih naik saat data ditambah, mengumpulkan data lebih banyak akan membantu. Kalau sudah datar, data tambahan tidak menolong; perbaiki fitur atau modelnya.

## 6. Hyperparameter tuning

Hyperparameter adalah pengaturan yang tidak dipelajari dari data (`max_depth`, `C`, `learning_rate`). Cara mencarinya:

| Metode | Cara | Kapan |
|---|---|---|
| Grid search | Coba semua kombinasi | Sedikit parameter, sedikit nilai |
| Random search | Coba kombinasi acak | Banyak parameter; biasanya lebih efisien |
| Bayesian (Optuna) | Kombinasi berikutnya dipilih dari hasil sebelumnya | Training mahal |

```python
from sklearn.model_selection import RandomizedSearchCV
from sklearn.ensemble import RandomForestClassifier
from scipy.stats import randint

cari = RandomizedSearchCV(
    RandomForestClassifier(random_state=0, n_jobs=-1),
    param_distributions={
        "n_estimators": randint(100, 500),
        "max_depth": [None, 5, 10, 20],
        "min_samples_leaf": randint(1, 10),
        "max_features": ["sqrt", 0.5, 1.0],
    },
    n_iter=20, cv=cv, scoring="roc_auc", random_state=0, n_jobs=-1,
).fit(X_tr, y_tr)
print(cari.best_params_, round(cari.best_score_, 3))
print(round(cari.score(X_te, y_te), 3))   # data uji hanya disentuh sekali, di akhir
```

Aturan yang tidak boleh dilanggar: data uji **hanya dipakai sekali**, setelah semua pilihan selesai. Kalau kamu memilih model berdasarkan skor uji, data uji sudah berubah fungsi menjadi data validasi dan skornya tidak lagi jujur. Untuk estimasi yang benar-benar tidak bias saat tuning intensif, gunakan *nested cross-validation*.

## Latihan

1. Hitung MAE, RMSE, dan R² untuk dua model regresi, lalu jelaskan model mana yang kamu pilih untuk memprediksi kebutuhan stok dan kenapa.
2. Buat dataset dengan 2% kelas positif (`make_classification(weights=[0.98])`). Bandingkan accuracy, F1, ROC-AUC, dan average precision dari model yang selalu menebak negatif.
3. Plot kurva ROC dan precision-recall untuk tiga model pada satu grafik.
4. Tunjukkan kebocoran data: scale seluruh data sebelum cross-validation, lalu bandingkan dengan pipeline yang benar pada data yang sangat kecil.
5. Tuning XGBoost atau Random Forest dengan `RandomizedSearchCV`, lalu buat kurva belajar untuk model terbaik.
