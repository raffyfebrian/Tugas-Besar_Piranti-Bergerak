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
- Sinkronisasi pesanan antar-tab (tamu, kasir, dapur) tanpa reload, plus notifikasi suara di meja kasir dan dapur.
- QR kamar asli yang dapat dipindai dan lembar cetak QR untuk semua kamar.
- QR kamar memakai **deep link aplikasi** (`ngoffe://order?room=NNN`) sehingga memindai QR di HP yang sudah memasang APK langsung membuka aplikasi dengan kamar terisi.
- Ikon launcher, splash screen, dan favicon **brand Ngoffe ID** (hijau pinus + cangkir kopi), dibuat ulang lewat skrip lokal.
- Timer SLA dapur dan animasi mikro pada menu, keranjang, serta timeline status.
- Perilaku khas aplikasi Android: tombol **back** kembali ke halaman sebelumnya, status bar hijau, dan **getaran haptik** saat menambah keranjang atau memvalidasi pesanan.
- Animasi mikro tambahan: **fly-to-cart**, angka KPI **count-up**, dan kartu pesanan masuk berurutan (stagger).
- **Bagikan struk** dari detail pesanan kasir lewat dialog berbagi Android/Web Share, dengan fallback salin ke clipboard.
- **Layar dapur tetap menyala** memakai Screen Wake Lock API selama antrean dipantau.
- **Showcase 3D di beranda**: karusel menu signature berputar dalam ruang 3D, bisa digeser (mouse/sentuh) dengan inersia, tombol putar, dan auto-rotate yang berhenti saat kursor di atas panggung.
- **Estimasi tiba (ETA)** di halaman status: sisa menit dan jam perkiraan tiba, dihitung dari lama penyiapan tiket + antrean dapur yang lebih dulu + waktu antar, dan disegarkan tiap 30 detik.
- **Notifikasi status pesanan**: tamu bisa mengaktifkan notifikasi (plugin `@capacitor/local-notifications` di APK, Web Notifications di browser) agar tetap tahu saat pesanan siap diantar walau halaman tidak dibuka; perubahan status juga memunculkan toast + nada singkat.
- **Skeleton loading + code splitting**: halaman staf/admin, pembayaran, dan panggung 3D dimuat terpisah dengan fallback shimmer skeleton, sehingga layar awal terasa lebih cepat.
- **Transisi halaman dan timeline beranimasi**: konten masuk halus, garis timeline tumbuh bertahap, dan ada progress bar tahap pesanan dengan persentase.
- **Timer masak per item di dapur**: setiap item tiket punya tombol *Mulai masak* dan *Selesai* dengan penghitung waktu berjalan; tombol *Tandai Siap* baru aktif setelah semua item selesai, dan ada *Mulai semua* untuk menyiapkan tiket sekaligus.
- **Stok otomatis dari resep**: setiap menu punya resep per porsi, stok bahan berkurang otomatis saat pesanan pertama kali masuk dapur, bahan dikembalikan bila pesanan di-void, dan staf menerima toast + nada peringatan ketika bahan menembus batas minimum.
- **Shift & rekonsiliasi kas**: kasir membuka shift dengan kas awal, memantau penjualan cash/QRIS berjalan, lalu menutup shift dengan uang fisik di laci; selisih kas dihitung otomatis dan riwayat shift tersimpan.
- **Void / refund dengan audit trail**: pembatalan pesanan wajib beralasan, bisa disertai refund cash/QRIS, tercatat permanen di audit trail (halaman transaksi & shift), dan struk tamu diberi stempel VOID.
- **Riwayat pesanan kamar + "Pesan lagi"**: halaman status menampilkan pesanan terakhir dari kamar tamu (maksimal 8), lengkap dengan status, rincian item, dan ulasan; satu ketukan menambahkan semua item lama ke keranjang (menu habis otomatis dilewati).
- **Rating bintang & ulasan tamu**: setelah pesanan `selesai`, tamu dapat memberi 1–5 bintang plus komentar; hasilnya tampil di **Admin → Laporan** sebagai KPI rating, grafik distribusi bintang, rating per menu terlaris, dan daftar ulasan terbaru.
- **Konfeti & animasi ulasan**: kiriman ulasan memicu hujan konfeti singkat, bintang meletup, dan kartu riwayat muncul berurutan; semua animasi berhenti saat *reduce motion* aktif.

> Catatan: prototipe ini **tanpa backend**. Seluruh data disimpan di `localStorage` browser (`ngoffe-ionic-state-v1`) dan sudah berisi data demo.

---

## Menjalankan

Prasyarat: Node.js 20+ dan npm.

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

### Jalankan lewat VS Code

1. Buka folder proyek: **File → Open Folder**.
2. Buka terminal: **Terminal → New Terminal**.
3. Jalankan:

   ```powershell
   npm install
   npm run dev
   ```

   Alternatif memakai Ionic CLI: `npm run ionic:serve`.

4. Atau pakai task siap pakai lewat **Terminal → Run Task**:
   - `Ionic: Install dependencies`
   - `Ionic: Jalankan aplikasi (dev server)` (default `Ctrl+Shift+B`)
   - `Ionic: Serve via Ionic CLI`
   - `Ionic: Build produksi`, `Ionic: Lint`, `Ionic: Unit test`
   - `Android: Sync aset web`, `Android: Build APK debug`

Ekstensi yang disarankan akan muncul otomatis: ESLint, Prettier, Webnative (Ionic), Vitest, dan Playwright.

Perintah lain:

```bash
npm run build       # build produksi ke dist/
npm run preview     # pratinjau hasil build
npm run test:unit   # unit test (Vitest)
npm run lint        # ESLint + Prettier check
npm run assets:brand # buat ulang ikon, splash, dan favicon Ngoffe ID
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
  pages/kasir/          # Pesanan, Detail, Transaksi, Shift & Kas
  pages/kitchen/        # Antrean dapur + timer masak + stok
  pages/admin/          # Dashboard, Menu, Kamar, Staf, Stok & Resep, Laporan, Pengaturan
  utils/                # format, ETA, resep stok, timer dapur, rating/feedback, native, dsb.
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

Cara paling mudah (JDK, SDK, dan env diatur otomatis, APK juga disalin ke root proyek):

```powershell
npm run android:apk
```

Atau jalankan langkahnya manual bila `JAVA_HOME`/`ANDROID_HOME` sudah diset:

```bash
npm run build
npx cap sync android
cd android
./gradlew.bat assembleDebug
```

> `npm run android:apk` memakai `scripts/build-apk.ps1`. Skrip ini otomatis memakai JDK 21 di `%LOCALAPPDATA%\Android\jdk-21` dan SDK di `%LOCALAPPDATA%\Android\Sdk` bila kedua variabel lingkungan belum diset (misalnya saat terminal dibuka dari IDE). Gradle wrapper sudah ada di repo, jadi **tidak perlu download Gradle/Android Studio** untuk membangun APK di mesin ini.

Hasil: `android/app/build/outputs/apk/debug/app-debug.apk` (APK debug, ditandatangani debug key, siap di-sideload).

Install ke perangkat/emulator yang terhubung:

```powershell
adb install -r ngoffe-id-debug.apk
```

> APK debug juga disalin ke root proyek sebagai `ngoffe-id-debug.apk` untuk memudahkan pemakaian.
> Untuk Play Store, perlu build `assembleRelease`/AAB dengan keystore release tersendiri.

### Perilaku native (Capacitor)

Semua panggilan native dibungkus `Capacitor.isNativePlatform()` di `src/utils/native.ts`, sehingga web tetap berjalan normal tanpa error.

| Fitur | Perilaku |
| --- | --- |
| Tombol back Android | Menutup modal/alert yang terbuka lebih dulu, lalu kembali ke halaman sebelumnya; baru keluar aplikasi di halaman akar. |
| Status bar | Gaya ikon terang dengan latar hijau pinus `#1f5c45` (sama dengan `theme-color`), tidak menimpa konten (non-overlay). |
| Haptics | Getaran ringan saat menambah/mengurangi jumlah, getaran sukses saat pesanan divalidasi/selesai. |
| Suara dapur | Kitchen ikut berbunyi saat ada pesanan baru masuk antrean; preferensi **Suara Aktif/Mati** dibagi bersama kasir (`ngoffe-sound`). |
| Bagikan struk | Tombol **Bagikan** di panel Struk Digital memakai `@capacitor/share` (dialog berbagi Android), lalu `navigator.share`, lalu salin ke clipboard. |
| Layar dapur | Screen Wake Lock API menahan layar tetap menyala selama halaman Kitchen aktif; preferensi disimpan di `ngoffe-keep-awake`. |
| Notifikasi status | `@capacitor/local-notifications` menampilkan notifikasi sistem saat status pesanan berubah; channel `ngoffe-status`, izin `POST_NOTIFICATIONS` sudah dideklarasikan plugin. Di web memakai `Notification` API. |

Animasi mikro memakai Web Animations API + CSS (`src/utils/flyToCart.ts`, `src/components/CountUp.tsx`) dan otomatis dinonaktifkan saat pengguna mengaktifkan *reduce motion*.

Showcase 3D beranda (`src/components/Showcase3D.tsx`) dibangun murni dengan CSS `transform-style: preserve-3d` + `requestAnimationFrame`, tanpa library 3D tambahan. Enam kartu disusun melingkar (`rotateY` + `translateZ`), opacity tiap kartu dihitung dari sudutnya agar kedalaman terasa, dan auto-rotate berhenti saat kursor berada di panggung atau saat *reduce motion* aktif. Menu dipilih lewat `pickSignatureItems` supaya tiap kategori terwakili.

### Estimasi tiba, notifikasi, dan skeleton

- **ETA** dihitung `estimateOrderEta` (`src/utils/eta.ts`): `BASE_PREP_MINUTES` + `PER_ITEM_MINUTES` per item tambahan (maksimal 28 menit), ditambah sisa waktu tiket lain yang lebih dulu masuk antrean dapur, ditambah `DELIVERY_MINUTES`, lalu dibatasi `MAX_TOTAL_MINUTES` (45 menit). Status `menunggu_pembayaran`, `selesai`, dan `dibatalkan` tidak diberi ETA.
- **Notifikasi status** memakai `src/utils/statusNotify.ts` + `useOrderStatusNotice`. Di native memakai `LocalNotifications` dengan channel `ngoffe-status`; di web memakai `Notification` API dan hanya muncul saat tab tidak terlihat. Preferensi tamu disimpan di `ngoffe-notify-enabled` dan baru dianggap aktif setelah izin diberikan.
- **Skeleton** berasal dari `React.lazy` + `Suspense` (`src/components/Skeleton.tsx`): `PageSkeleton` untuk halaman staf/admin/pembayaran, `ShowcaseSkeleton` untuk panggung 3D, dan `MenuGridSkeleton` untuk daftar menu.
- **Transisi dan timeline** murni CSS di `src/theme/app.css`: `pageEnter` pada `ion-content::part(scroll)`, `skeletonShimmer` pada balok skeleton, `lineGrow` pada garis timeline yang selesai, gradien parsial untuk tahap aktif, serta `progress-fill` dengan sheen. Semua animasi ikut berhenti saat *prefers-reduced-motion*.

### Riwayat pesanan, rating, dan konfeti

- **Riwayat per kamar** (`src/pages/guest/OrderStatusPage.tsx`): pesanan kamar diurutkan dari yang terbaru (maksimal 8 kartu). Setiap kartu punya status, chip item, total, tombol *Lihat status*, dan *Pesan lagi*.
- **Pesan lagi** (`reorder` di `AppStore`): item pesanan lama digabung ke keranjang (jumlah ditambahkan bila menu sama, catatan ikut disalin); menu yang sedang tidak tersedia dilewati agar keranjang tetap valid.
- **Ulasan tamu** (`Order.feedback`, `submitFeedback`): rating 1–5 + komentar opsional, disimpan sekali per pesanan saat status `selesai`. Helper di `src/utils/feedback.ts` menghitung rata-rata, distribusi bintang, rating per menu, dan ulasan terbaru.
- **Komponen bersama**: `StarRating` (mode tampil & interaktif) dan `Confetti` (portal ke `document.body`, 30 keping, bersih sendiri setelah ±2,6 detik). Data demo di `src/data/seed.ts` sudah memuat tiga ulasan agar laporan langsung terisi.

### Operasional dapur, stok, dan kas

- **Resep & konsumsi stok** (`src/utils/recipes.ts`): `MenuItem.recipe` menyimpan bahan per porsi dalam satuan stok (presisi dua desimal). Saat status pesanan pertama kali menjadi `diproses`, `setOrderStatus` memotong stok lewat `applyConsumption`; void mengembalikannya lewat `restoreConsumption` dan menandai `stockRestored` agar tidak terhitung dua kali. Bahan baru ditambahkan otomatis saat migrasi `localStorage` (mis. `stock-kentang`, `stock-teh`).
- **Timer masak** (`src/utils/kitchen.ts`): status timer per item disimpan di `Order.prep.items` (`startedAt`/`finishedAt`). Halaman Kitchen berdetak tiap detik, menampilkan `mm:ss`, dan memakai `prepStats` untuk mengaktifkan tombol *Tandai Siap* hanya ketika semua item selesai.
- **Peringatan stok** (`useLowStockAlert`): hanya bahan yang *baru* melewati batas minimum yang memicu toast + nada, dipasang sekali di `StaffShell` sehingga berlaku di kasir, dapur, dan admin.
- **Shift kasir** (`src/pages/kasir/KasirShift.tsx`): shift terbuka per staf dengan `openingCash`. Penjualan dihitung dari pesanan dalam rentang shift (tanpa pesanan batal/belum dibayar); saat tutup, `expectedCash = openingCash + cashSales`, lalu selisih terhadap uang fisik disimpan bersama `closedAt`, `qrisSales`, `orderCount`, dan catatan.
- **Void/refund** (`voidOrder` di `AppStore`): alasan wajib, refund dibatasi maksimal total pesanan, status menjadi `dibatalkan`, dan setiap aksi menulis `AuditEntry` (`action`, `amount`, `method`, `reason`, `by`). Audit tampil di detail pesanan, halaman transaksi, dan halaman shift.

### Ikon, splash, dan deep link QR

Aset brand dibuat offline dengan `System.Drawing` (tanpa `@capacitor/assets`):

```powershell
npm run assets:brand
```

Perintah ini menulis ulang `android/app/src/main/res/mipmap-*` (ikon legacy, round, foreground adaptive), seluruh `drawable-*/splash.png`, serta `public/favicon.png`, `public/icon-192.png`, `public/icon-512.png`, dan `public/apple-touch-icon.png`. Setelah itu jalankan `npx cap sync android` agar ikon/splash masuk ke APK.

QR kamar di **Admin → Kamar** berisi `ngoffe://order?room=204` (skema alternatif: `id.ngoffe.cafe://order?room=204`). Intent filter `VIEW`/`BROWSABLE` sudah didaftarkan di `android/app/src/main/AndroidManifest.xml`, dan `DeepLinkBridge` meneruskan URL ke router Ionic. Uji tanpa kamera:

```powershell
adb shell am start -a android.intent.action.VIEW -d "ngoffe://order?room=204"
```

> Sebagian aplikasi kamera hanya menampilkan teks untuk skema kustom. Jika QR tidak membuka aplikasi, gunakan perintah `adb` di atas atau tombol **Buka Halaman Pesanan** di jendela QR. Untuk produksi, daftarkan App Links `https://domain/order?room=...` dengan `assetlinks.json`.

---

## Catatan prototipe

- QR kamar dibuat dengan `qrcode.react` dan berisi deep link `ngoffe://order?room=NNN`; bisa dipindai kamera HP (dengan APK terpasang) dan dicetak dari **Admin → Kamar**.
- QRIS hanya menampilkan QR tiruan; bukti transfer disimpan sebagai **nama berkas**, bukan file gambar.
- Data bertahan di `localStorage`. Reset lewat **Admin → Pengaturan → Reset Data Demo**.
- Pesanan disinkronkan antar-tab lewat `BroadcastChannel` (`ngoffe-orders-sync-v1`), dengan fallback event `storage`.
- Login staf disimpan di state (belum ada autentikasi server/JWT).
