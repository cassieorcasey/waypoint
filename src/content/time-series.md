Catatan ini mengikuti lima langkah di checklist. Data deret waktu berbeda dari data tabel biasa karena **urutan waktu penting**: baris tidak bebas satu sama lain, dan masa depan tidak boleh bocor ke masa lalu. Akibatnya, cara membagi data, memilih fitur, dan menilai model ikut berubah.

```python
import numpy as np
import pandas as pd

# Data buatan: penjualan harian dengan tren, pola mingguan, dan derau
rng = np.random.default_rng(0)
hari = pd.date_range("2024-01-01", periods=730, freq="D")
tren = np.linspace(100, 160, len(hari))
mingguan = 15 * np.sin(2 * np.pi * hari.dayofweek / 7)
y = pd.Series(tren + mingguan + rng.normal(0, 5, len(hari)), index=hari, name="penjualan")
print(y.head(3).round(1).to_dict())
```

## 1. Komponen: tren, musiman, residu, stasioneritas

Hampir semua deret waktu bisa dipandang sebagai gabungan:

| Komponen | Arti | Contoh |
|---|---|---|
| Tren | Arah jangka panjang | Penjualan naik 5% per kuartal |
| Musiman (*seasonality*) | Pola berulang dengan periode tetap | Ramai tiap akhir pekan, tiap Desember |
| Siklus | Naik turun tanpa periode tetap | Siklus ekonomi |
| Residu | Sisa yang tidak dijelaskan | Kejadian acak, promo dadakan |

Sebuah deret **stasioner** jika rata-rata dan variansnya tidak berubah menurut waktu. Banyak model klasik (ARIMA) membutuhkan itu, dan caranya biasanya dengan *differencing* (`y.diff()`) atau transformasi log.

```python
# Dekomposisi sederhana tanpa pustaka tambahan
tren_est = y.rolling(7, center=True).mean()              # rata-rata 7 hari meredam pola mingguan
sisa = (y - tren_est).dropna()
musiman_est = sisa.groupby(sisa.index.dayofweek).mean()   # rata-rata per hari dalam seminggu
print(musiman_est.round(1).to_dict())

# Differencing menghilangkan tren
selisih = y.diff().dropna()
print(round(y.iloc[:365].mean() - y.iloc[365:].mean(), 1), "<- rata-rata bergeser (tidak stasioner)")
print(round(selisih.iloc[:365].mean() - selisih.iloc[365:].mean(), 2), "<- hampir sama setelah diff")
```

Untuk dekomposisi yang lebih lengkap, `statsmodels.tsa.seasonal.seasonal_decompose` atau `STL` melakukannya langsung. Selalu **plot dulu** sebelum memodelkan: tren, pola musiman, lonjakan, dan data hilang kelihatan jelas di grafik.

## 2. Baseline wajib

Sebelum model apa pun, hitung tiga baseline. Banyak model canggih ternyata kalah dari **seasonal naive**.

| Baseline | Aturan |
|---|---|
| Naive | Prediksi = nilai terakhir |
| Seasonal naive | Prediksi = nilai pada periode musiman yang sama sebelumnya (misalnya 7 hari lalu) |
| Moving average | Prediksi = rata-rata k titik terakhir |

```python
def mase(y_true, y_pred, y_train, m=1):
    """Mean Absolute Scaled Error: error dibagi error naive musiman di data latih. < 1 berarti lebih baik dari naive."""
    skala = np.mean(np.abs(y_train.values[m:] - y_train.values[:-m]))
    return np.mean(np.abs(y_true.values - y_pred.values)) / skala

latih, uji = y.iloc[:-28], y.iloc[-28:]                   # empat minggu terakhir untuk uji

naive = pd.Series(latih.iloc[-1], index=uji.index)
seasonal_naive = pd.Series(np.tile(latih.iloc[-7:].values, 4), index=uji.index)
rata_rata = pd.Series(latih.iloc[-7:].mean(), index=uji.index)

for nama, pred in [("naive", naive), ("seasonal naive", seasonal_naive), ("moving average", rata_rata)]:
    print(f"{nama:15s} MAE={np.mean(np.abs(uji - pred)):6.2f}  MASE={mase(uji, pred, latih, m=7):.2f}")
```

## 3. Model klasik: ETS dan ARIMA

**Exponential smoothing (ETS)** meramal dengan rata-rata berbobot yang menurun secara eksponensial ke masa lalu: data terbaru berbobot paling besar. Versi Holt-Winters menambah komponen tren dan musiman.

```python
def exp_smoothing(seri, alpha):
    """Simple exponential smoothing: level_t = alpha * y_t + (1 - alpha) * level_{t-1}."""
    level = seri.iloc[0]
    for nilai in seri.iloc[1:]:
        level = alpha * nilai + (1 - alpha) * level
    return level                                           # prediksi datar untuk semua horizon

for alpha in (0.1, 0.5, 0.9):
    print(alpha, round(exp_smoothing(latih, alpha), 1))     # alpha kecil: halus, alpha besar: cepat mengikuti data
```

**ARIMA(p, d, q)** menggabungkan tiga hal: `p` lag nilai sebelumnya (AR), `d` kali differencing, dan `q` lag galat (MA). **SARIMA** menambah bagian musiman. Contoh dengan `statsmodels` (pustaka ini dan `statsforecast` menjadi pilihan umum):

```python
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.arima.model import ARIMA

ets = ExponentialSmoothing(latih, trend="add", seasonal="add", seasonal_periods=7).fit()
pred_ets = ets.forecast(28)

arima = ARIMA(latih, order=(1, 1, 1), seasonal_order=(1, 0, 1, 7)).fit()
pred_arima = arima.forecast(28)
```

Model klasik unggul pada **satu deret** dengan data tidak terlalu panjang dan memberi interval prediksi yang jelas. Kelemahannya: sulit memasukkan banyak fitur luar (harga, promo, cuaca) dan harus dilatih per deret.

## 4. Forecasting dengan ML

Ubah masalah deret waktu menjadi masalah tabel: setiap baris adalah satu titik waktu, fitur dibuat dari **masa lalu**.

| Jenis fitur | Contoh |
|---|---|
| Lag | Nilai 1, 7, 14 hari lalu |
| Rolling | Rata-rata dan standar deviasi 7 dan 28 hari terakhir |
| Kalender | Hari dalam minggu, bulan, hari libur, tanggal gajian |
| Eksternal | Harga, promo, cuaca, yang **nilainya sudah diketahui saat prediksi** |

Aturan keras: fitur untuk prediksi hari *t* hanya boleh memakai informasi yang tersedia **sebelum** *t*. Rolling harus digeser satu langkah (`shift(1)`), kalau tidak, nilai hari itu sendiri ikut masuk.

```python
from sklearn.ensemble import HistGradientBoostingRegressor

def buat_fitur(seri):
    df = pd.DataFrame({"y": seri})
    for lag in (1, 7, 14):
        df[f"lag_{lag}"] = seri.shift(lag)
    df["rata_7"] = seri.shift(1).rolling(7).mean()          # shift(1) mencegah kebocoran
    df["hari"] = seri.index.dayofweek
    df["urutan"] = np.arange(len(seri))                      # pengganti tren untuk model pohon
    return df.dropna()

df = buat_fitur(y)
X, target = df.drop(columns="y"), df["y"]
X_tr, X_te = X.iloc[:-28], X.iloc[-28:]
y_tr, y_te = target.iloc[:-28], target.iloc[-28:]

model = HistGradientBoostingRegressor(random_state=0).fit(X_tr, y_tr)
pred = pd.Series(model.predict(X_te), index=y_te.index)
print("MAE model:", round(np.mean(np.abs(y_te - pred)), 2))
```

Catatan penting: pohon keputusan **tidak bisa mengekstrapolasi tren**, karena prediksinya tidak pernah melewati nilai yang ada di data latih. Atasi dengan memodelkan *selisih* (`y - lag_7`) atau menghilangkan tren lebih dulu. Untuk peramalan banyak deret sekaligus (ribuan produk), satu model global di atas fitur lag biasanya mengalahkan ribuan model klasik.

## 5. Validasi yang benar

Acak-acakan seperti `train_test_split(shuffle=True)` atau K-fold biasa **tidak boleh dipakai**: model akan "melihat masa depan" saat latihan. Gunakan validasi **walk-forward**: latih di masa lalu, uji di masa setelahnya, lalu geser.

```python
from sklearn.model_selection import TimeSeriesSplit

tss = TimeSeriesSplit(n_splits=5, test_size=28)
skor = []
for tr, te in tss.split(X):
    m = HistGradientBoostingRegressor(random_state=0).fit(X.iloc[tr], target.iloc[tr])
    pred_te = pd.Series(m.predict(X.iloc[te]), index=target.index[te])
    skor.append(mase(target.iloc[te], pred_te, target.iloc[tr], m=7))
print([round(float(s), 2) for s in skor])
print("MASE rata-rata:", round(float(np.mean(skor)), 2))
```

Hal yang perlu diwaspadai:

- **Horizon prediksi.** Model yang bagus untuk besok belum tentu bagus untuk 28 hari ke depan. Uji pada horizon yang benar-benar dipakai bisnis.
- **Prediksi rekursif vs langsung.** Memakai prediksi kemarin sebagai lag hari ini menumpuk galat; alternatifnya satu model per horizon.
- **Metrik.** MAE mudah dibaca, MAPE meledak ketika nilai asli mendekati nol, sehingga MASE atau sMAPE lebih aman. Pilih sesuai biaya keputusan: kelebihan stok dan kekurangan stok biasanya tidak sama mahal.
- **Perubahan regime.** Pandemi, perubahan harga, atau fitur produk baru memutus pola lama. Pantau galat terhadap waktu dan latih ulang berkala.
- **Interval prediksi.** Keputusan seperti jumlah stok butuh rentang, bukan hanya angka tunggal.

## Latihan

1. Ambil satu deret waktu publik (penjualan, trafik, suhu), plot, lalu tulis tren dan pola musimannya dengan kata-katamu sendiri.
2. Hitung naive, seasonal naive, dan moving average, lalu catat MASE-nya sebagai standar yang harus dikalahkan.
3. Latih ETS dan ARIMA dengan `statsmodels`, bandingkan dengan baseline pada horizon 28 hari.
4. Buat model fitur lag dengan `HistGradientBoostingRegressor` dan validasi dengan `TimeSeriesSplit`. Uji sengaja menghilangkan `shift(1)` pada fitur rolling dan lihat skornya "membaik" secara palsu.
5. Tulis satu paragraf untuk manajer: seberapa jauh ramalan ini bisa dipercaya, dan keputusan apa yang aman diambil berdasarkan rentangnya.

Rujukan: *Forecasting: Principles and Practice* (Hyndman) dan dokumentasi `TimeSeriesSplit` di bagian sumber belajar.
