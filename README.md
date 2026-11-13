# Ngoffe ID — Aplikasi Pemesanan Café & Hotel (Ionic React)

Prototipe aplikasi pemesanan menu café langsung dari kamar hotel, dibangun dengan **Ionic 9 + React 19 + TypeScript + Vite**, dan disiapkan untuk **Web** serta **Android (Capacitor)**.

Repo: https://github.com/raffyfebrian/Tugas-Besar_Piranti-Bergerak


Aplikasi ini mengikuti spesifikasi `penjelasan_sistem_ngoffe_id.md`:

- Website publik: Beranda, Tentang, Menu, Galeri, Kontak.
- Pemesanan tamu lewat simulasi scan QR kamar.
- Keranjang + catatan per item, pembayaran **QRIS** (unggah bukti) atau **cash**.
- Nomor pesanan otomatis dengan format `NGF-YYYYMMDD-0001`.
- Workspace staf: **Kasir**, **Kitchen**, **Admin** dengan hak akses berbeda.
- Tema hijau menyeluruh: hijau pinus, mint lembut, dan aksen hijau segar (status peringatan/batal tetap berwarna agar mudah dibedakan).
- Sinkronisasi pesanan antar-tab (tamu, kasir, dapur) tanpa reload, plus notifikasi suara di meja kasir.
- QR kamar asli yang dapat dipindai dan lembar cetak QR untuk semua kamar.
- Timer SLA dapur dan animasi mikro pada menu, keranjang, serta timeline status.

> Catatan: prototipe ini **tanpa backend**. Seluruh data disimpan di `localStorage` browser (`ngoffe-ionic-state-v1`) dan sudah berisi data demo.

---

## Menjalankan

Prasyarat: Node.js 20+ dan npm.

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

Perintah lain:

```bash
npm run build       # build produksi ke dist/
npm run preview     # pratinjau hasil build
npm run test:unit   # unit test (Vitest)
npm run lint        # ESLint + Prettier check
```

Jika Node tidak terpasang global di mesin ini, gunakan Node portabel:

```powershell
$env:PATH = "D:\Sems 3\Sistem Informasi\Tugas Besar\.tools\node-v24.22.2-win-x64;" + $env:PATH
npm run dev
```

---

## Akun demo staf

| Peran   | Email               | Password    |
| ------- | ------------------- | ----------- |
| Kasir   | `kasir@ngoffe.id`   | `kasir123`  |
| Kitchen | `kitchen@ngoffe.id` | `kitchen123`|
| Admin   | `admin@ngoffe.id`   | `admin123`  |

Halaman login: `/staff`. Tombol akun demo di halaman login otomatis mengisi kredensial.

---

## Alur demo yang disarankan

1. **Tamu** — buka `/order`, pilih kamar (mis. `204`) atau buka `/order?room=204`.
2. Pilih menu, tambahkan ke keranjang, isi catatan (mis. “tanpa gula”) dan nama tamu.
3. Pilih **QRIS** (unggah gambar bukti transfer) atau **Cash**, lalu konfirmasi.
4. Catat nomor pesanan, mis. `NGF-20261105-0009`. Status awal: **Menunggu Validasi**.
5. **Kasir** — login, buka pesanan, klik **Validasi & Kirim ke Dapur**.
6. **Kitchen** — login, klik **Tandai Siap** pada antrean.
7. **Kasir** — buka detail pesanan, klik **Mulai Antar ke Kamar**, lalu **Selesaikan Pesanan**.
8. Halaman status tamu (`/order/status/:id`) ikut memperbarui timeline secara real-time.

Alur status:

```
menunggu_pembayaran → menunggu_validasi → diproses → siap_diantar → diantar → selesai
                                                                              ↘ dibatalkan
```

### Demo cepat lintas tab

1. Buka dua tab: `/order?room=204` (tamu) dan `/staff` (kasir).
2. Buat pesanan cash di tab tamu. Tab kasir langsung menampilkan pesanan baru, badge berdenyut, toast, dan nada notifikasi (klik **Suara Aktif** sekali untuk mengizinkan audio browser).
3. Validasi pesanan di kasir, lalu buka `/staff/kitchen` di tab ketiga. Antrean dapur ikut diperbarui tanpa reload.

---

## Hak akses

| Modul | Kasir | Kitchen | Admin |
| --- | --- | --- | --- |
| Validasi pembayaran & transaksi | ✅ | — | ✅ |
| Antrean dapur & stok bahan | — | ✅ | ✅ |
| Menu, kamar/QR, staf, laporan, pengaturan | — | — | ✅ |

Route admin dilindungi `RequireRole`; kasir/kitchen yang membuka `/admin` akan diarahkan kembali ke workspace-nya.

---

## Struktur singkat

```
src/
  App.tsx               # routing + guard peran + provider
  data/seed.ts          # data demo (menu, kamar, staf, stok, pesanan)
  store/AppStore.tsx    # state global & seluruh aksi (localStorage)
  components/           # shell publik/staf/tamu, menu, kartu, QR, dll.
  pages/public/         # Beranda, Tentang, Menu, Galeri, Kontak
  pages/guest/          # Scan, OrderMenu, Cart, Payment, OrderStatus
  pages/staff/          # Login
  pages/kasir/          # Pesanan, Detail, Transaksi
  pages/kitchen/        # Antrean dapur + stok
  pages/admin/          # Dashboard, Menu, Kamar, Staf, Stok, Laporan, Pengaturan
  theme/                # variabel & styling Ngoffe ID
android/                # proyek native Capacitor Android
```

---

## Build Android (APK)

Proyek native Capacitor ada di `android/` dan **APK debug sudah berhasil dibangun**.

Prasyarat:

- **Node.js 20+** untuk `npm run build` dan `npx cap sync android`.
- **JDK 21** — Android Gradle Plugin 8.13 belum mendukung JDK 26.
- **Android SDK**: `platforms;android-36`, `build-tools;36.0.0`, `platform-tools`.
- File `android/local.properties` berisi `sdk.dir=<path Android SDK>`.

Langkah build:

```bash
npm run build
npx cap sync android
cd android
./gradlew.bat assembleDebug
```

Hasil: `android/app/build/outputs/apk/debug/app-debug.apk` (APK debug, ditandatangani debug key, siap di-sideload).

Install ke perangkat/emulator yang terhubung:

```powershell
adb install -r ngoffe-id-debug.apk
```

> APK debug juga disalin ke root proyek sebagai `ngoffe-id-debug.apk` untuk memudahkan pemakaian.
> Untuk Play Store, perlu build `assembleRelease`/AAB dengan keystore release tersendiri.

---

## Catatan prototipe

- QR kamar dibuat dengan `qrcode.react` dan mengarah ke `/order?room=NNN`; bisa dipindai kamera HP dan dicetak dari **Admin → Kamar**.
- QRIS hanya menampilkan QR tiruan; bukti transfer disimpan sebagai **nama berkas**, bukan file gambar.
- Data bertahan di `localStorage`. Reset lewat **Admin → Pengaturan → Reset Data Demo**.
- Pesanan disinkronkan antar-tab lewat `BroadcastChannel` (`ngoffe-orders-sync-v1`), dengan fallback event `storage`.
- Login staf disimpan di state (belum ada autentikasi server/JWT).
