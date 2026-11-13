Catatan ini mengikuti tujuh langkah di checklist. Supervised learning belajar dari contoh berlabel: diberi fitur `X` dan jawaban `y`, model mencari pola supaya bisa menebak `y` untuk data baru. Ada dua jenis tugas: **regresi** (menebak angka, misalnya harga) dan **klasifikasi** (menebak kelas, misalnya churn atau tidak).

Semua model scikit-learn memakai pola yang sama: `fit` untuk belajar, `predict` untuk menebak, `score` untuk menilai.

```python
import numpy as np
from sklearn.datasets import load_diabetes, load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

Xr, yr = load_diabetes(return_X_y=True)          # regresi: perkembangan diabetes
Xc, yc = load_breast_cancer(return_X_y=True)     # klasifikasi: tumor jinak/ganas
Xr_tr, Xr_te, yr_tr, yr_te = train_test_split(Xr, yr, test_size=0.2, random_state=0)
Xc_tr, Xc_te, yc_tr, yc_te = train_test_split(Xc, yc, test_size=0.2, random_state=0, stratify=yc)
```

Selalu pisahkan data uji **sebelum** melakukan apa pun, dan jangan menyentuhnya sampai evaluasi akhir.

## 1. Linear Regression

Model: `ŷ = w₁x₁ + w₂x₂ + … + b`. Bobot dicari dengan meminimalkan **MSE** (rata-rata kuadrat error), yang punya solusi tertutup maupun bisa dicari dengan gradient descent.

```python
from sklearn.linear_model import LinearRegression

lr = LinearRegression().fit(Xr_tr, yr_tr)
print(round(lr.score(Xr_te, yr_te), 3))     # R² di data uji
print(lr.coef_[:3], lr.intercept_)
```

Kelebihan: cepat, mudah dijelaskan (setiap koefisien = perubahan `y` per satu satuan fitur, fitur lain tetap). Asumsi yang perlu dicek: hubungan linear, error tidak berpola terhadap prediksi, dan fitur tidak saling berkorelasi sangat kuat (*multikolinearitas* membuat koefisien tidak stabil). Hubungan melengkung bisa ditangani dengan menambahkan fitur baru seperti `x²` atau `log(x)`.

## 2. Ridge dan Lasso

Regularisasi menambahkan penalti terhadap bobot besar supaya model tidak *overfit*:

| Model | Penalti | Efek |
|---|---|---|
| Ridge | `α · Σ w²` (L2) | Mengecilkan semua bobot, stabil saat fitur berkorelasi |
| Lasso | `α · Σ abs(w)` (L1) | Membuat sebagian bobot tepat nol = seleksi fitur otomatis |
| ElasticNet | Campuran keduanya | Kompromi |

```python
from sklearn.linear_model import RidgeCV, LassoCV

ridge = make_pipeline(StandardScaler(), RidgeCV(alphas=np.logspace(-3, 3, 13))).fit(Xr_tr, yr_tr)
lasso = make_pipeline(StandardScaler(), LassoCV(cv=5, random_state=0)).fit(Xr_tr, yr_tr)
print(ridge.score(Xr_te, yr_te), lasso.score(Xr_te, yr_te))
print("fitur dibuang Lasso:", (lasso[-1].coef_ == 0).sum())
```

`α` makin besar berarti penalti makin kuat dan model makin sederhana. Cari nilainya dengan cross-validation (`RidgeCV`, `LassoCV`). Karena penalti bergantung pada besar bobot, **fitur harus di-scale dulu**.

## 3. Logistic Regression

Walau namanya regresi, ini model **klasifikasi**. Kombinasi linear fitur dimasukkan ke fungsi sigmoid `σ(z) = 1 / (1 + e⁻ᶻ)` sehingga hasilnya peluang 0–1. Bobot dicari dengan meminimalkan **log loss**.

```python
from sklearn.linear_model import LogisticRegression

logreg = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(Xc_tr, yc_tr)
print(round(logreg.score(Xc_te, yc_te), 3))       # akurasi
proba = logreg.predict_proba(Xc_te)[:, 1]         # peluang kelas 1
pred = (proba >= 0.5).astype(int)                 # ambang bisa digeser sesuai kebutuhan
```

Koefisien dibaca sebagai perubahan **log-odds**; `np.exp(coef)` adalah *odds ratio*. Ambang 0,5 tidak wajib: untuk deteksi penyakit, ambang lebih rendah menangkap lebih banyak kasus dengan risiko lebih banyak alarm palsu. Logistic regression adalah baseline wajib untuk klasifikasi: cepat, terkalibrasi baik, dan mudah dijelaskan.

## 4. Decision Tree

Pohon keputusan memecah data berulang kali dengan pertanyaan ya/tidak ("apakah `radius > 15`?"). Setiap pecahan dipilih yang paling memurnikan kelompok (Gini atau entropy untuk klasifikasi, MSE untuk regresi).

```python
from sklearn.tree import DecisionTreeClassifier, export_text

tree = DecisionTreeClassifier(max_depth=3, min_samples_leaf=10, random_state=0).fit(Xc_tr, yc_tr)
print(round(tree.score(Xc_te, yc_te), 3))
print(export_text(tree, feature_names=list(load_breast_cancer().feature_names))[:400])
```

Kelebihan: mudah dibaca, menangkap interaksi dan hubungan non-linear, tidak butuh scaling. Kelemahan utama: pohon tanpa batas akan menghafal data latih (**overfit**) dan sangat sensitif terhadap perubahan kecil data. Kendalikan dengan `max_depth`, `min_samples_leaf`, atau `ccp_alpha`.

## 5. Random Forest

Random forest adalah **banyak pohon** yang masing-masing dilatih pada sampel acak data (*bootstrap*) dan subset acak fitur di setiap pecahan. Prediksi akhirnya adalah voting (klasifikasi) atau rata-rata (regresi). Teknik ini disebut *bagging*: kesalahan pohon-pohon yang berbeda saling meniadakan, sehingga varians turun drastis.

```python
from sklearn.ensemble import RandomForestClassifier

rf = RandomForestClassifier(n_estimators=300, n_jobs=-1, random_state=0).fit(Xc_tr, yc_tr)
print(round(rf.score(Xc_te, yc_te), 3))
penting = sorted(zip(rf.feature_importances_, load_breast_cancer().feature_names), reverse=True)[:5]
```

Random forest adalah model "langsung bagus" untuk data tabular: sedikit tuning, tahan outlier, tidak butuh scaling. `feature_importances_` berbasis impurity bisa bias ke fitur dengan banyak nilai unik; `permutation_importance` lebih dapat dipercaya.

## 6. SVM

Support Vector Machine mencari batas pemisah dengan **margin terlebar** antara kelas. Hanya titik-titik terdekat ke batas (*support vectors*) yang menentukan posisinya. Dengan **kernel trick** (misalnya RBF), SVM bisa membuat batas melengkung tanpa menghitung fitur berdimensi tinggi secara eksplisit.

```python
from sklearn.svm import SVC

svm = make_pipeline(StandardScaler(), SVC(kernel="rbf", C=1.0, gamma="scale", probability=True)).fit(Xc_tr, yc_tr)
print(round(svm.score(Xc_te, yc_te), 3))
```

Parameter: `C` besar = margin sempit, berusaha mengklasifikasi semua data latih dengan benar (risiko overfit); `gamma` besar = batas lebih berliku. SVM **wajib** di-scale dan kurang cocok untuk data sangat besar (waktu latih tumbuh lebih dari linear terhadap jumlah data). Kuat untuk dataset kecil sampai menengah berdimensi tinggi.

## 7. XGBoost dan LightGBM

**Gradient boosting** membangun pohon secara **berurutan**: setiap pohon baru belajar memperbaiki kesalahan (residual) gabungan pohon sebelumnya. Hasilnya biasanya model terbaik untuk data tabular, dan sering memenangkan kompetisi Kaggle.

```python
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split

X_fit, X_val, y_fit, y_val = train_test_split(Xc_tr, yc_tr, test_size=0.2, random_state=0, stratify=yc_tr)
xgb = XGBClassifier(
    n_estimators=1000, learning_rate=0.05, max_depth=4,
    subsample=0.8, colsample_bytree=0.8,
    eval_metric="logloss", early_stopping_rounds=50,
)
xgb.fit(X_fit, y_fit, eval_set=[(X_val, y_val)], verbose=False)
print(xgb.best_iteration, round(xgb.score(Xc_te, yc_te), 3))
```

```python
import lightgbm as lgb

lgbm = lgb.LGBMClassifier(n_estimators=1000, learning_rate=0.05, num_leaves=31, verbose=-1)
lgbm.fit(X_fit, y_fit, eval_set=[(X_val, y_val)], callbacks=[lgb.early_stopping(50, verbose=False)])
```

| | XGBoost | LightGBM |
|---|---|---|
| Pertumbuhan pohon | Per level (*depth-wise*) | Per daun (*leaf-wise*), lebih cepat |
| Kecepatan di data besar | Cepat | Biasanya lebih cepat |
| Kategori | Didukung (`enable_categorical`) | Didukung bawaan |

Parameter terpenting: `learning_rate` kecil + banyak pohon + **early stopping** pada data validasi, lalu `max_depth`/`num_leaves`, `subsample`, dan `colsample_bytree`. scikit-learn juga punya `HistGradientBoostingClassifier`: algoritma serupa LightGBM tanpa instalasi tambahan.

**Peta memilih model** untuk data tabular: mulai dari baseline sederhana (regresi linear/logistik), lalu Random Forest, lalu gradient boosting. Pilih yang paling sederhana jika selisih skornya kecil, karena model sederhana lebih mudah dijelaskan dan dirawat.

## Latihan

1. Latih ketujuh model di dataset breast cancer dengan pipeline yang sama, lalu buat tabel akurasi dan waktu latihnya.
2. Pada data diabetes, plot koefisien Lasso untuk 10 nilai `α`. Fitur mana yang paling lama bertahan?
3. Latih Decision Tree tanpa `max_depth` dan bandingkan skor train dan test-nya. Apa yang terjadi?
4. Geser ambang logistic regression dari 0,1 sampai 0,9 dan catat jumlah positif palsu dan negatif palsu.
5. Bandingkan `feature_importances_` dan `permutation_importance` pada Random Forest. Apakah urutannya sama?
