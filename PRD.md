   # Product Requirements Document (PRD)
# Tamuin (sebelumnya Buku Tamu Digital)

## 1. Ringkasan Produk

Tamuin adalah aplikasi frontend yang memudahkan tamu untuk mengisi data kunjungan secara online dan memudahkan admin untuk memantau serta mengelola daftar tamu dengan lebih cepat, aman, dan rapi. Aplikasi ini bertujuan menggantikan sistem pencatatan tamu secara manual yang sering kali memakan waktu, rawan kesalahan, dan sulit diakses saat diperlukan.

Produk ini dirancang untuk digunakan di kantor, lembaga, instansi, atau tempat usaha yang membutuhkan catatan kunjungan yang terstruktur dan terdokumentasi dengan baik.

## 2. Latar Belakang

Pada proses kunjungan manual, tamu biasanya mencatat nama, instansi, keperluan, dan waktu kedatangan di buku tamu fisik. Namun, metode ini memiliki beberapa kelemahan, seperti:

- Data mudah hilang atau rusak
- Proses pencarian data lama menjadi sulit
- Petugas harus melakukan input manual dan memeriksa kehadiran tamu satu per satu
- Tidak efisien untuk jumlah kunjungan yang besar
- Sulit untuk mengakses data dari perangkat lain

Dengan adanya sistem pencatatan tamu digital, data kunjungan dapat disimpan secara terorganisir dan diakses dengan lebih mudah oleh admin.

## 3. Tujuan Produk

### 3.1 Tujuan Umum
- Mengurangi penggunaan buku tamu fisik
- Mempercepat proses pencatatan kunjungan
- Menyediakan data tamu yang rapi dan mudah dicari
- Meningkatkan efisiensi operasional admin
- Memberikan pengalaman yang sederhana dan responsif bagi tamu dan admin

### 3.2 Tujuan Khusus
- Tamu dapat mengisi formulir kunjungan secara mandiri
- Admin dapat melihat daftar tamu dalam waktu nyata
- Aplikasi dapat diakses dari desktop maupun perangkat mobile
- Data input memiliki validasi agar tidak terjadi kesalahan pengisian

## 4. Target Pengguna

### 4.1 Tamu
- Mengunjungi kantor atau instansi
- Ingin mendaftar kunjungan dengan cepat tanpa harus menunggu petugas
- Membutuhkan proses yang sederhana dan mudah dipahami

### 4.2 Admin
- Bertanggung jawab untuk melihat dan mengelola data tamu
- Membutuhkan daftar kunjungan yang rapi dan mudah diakses
- Membutuhkan informasi seperti nama, instansi, tujuan, dan waktu kedatangan

## 5. User Persona

### Persona 1: Tamu Baru
- Umur: 20-45 tahun
- Kebutuhan: cepat, mudah, tidak membingungkan
- Masalah: sering harus menunggu saat datang ke lokasi

### Persona 2: Admin Kantor
- Umur: 25-50 tahun
- Kebutuhan: melihat data secara terstruktur, mencari kunjungan tertentu, mengelola data dengan cepat
- Masalah: data manual sulit dicari dan rawan hilang

## 6. Problem Statement

Sistem kunjungan yang masih manual menyebabkan proses pencatatan tamu kurang efisien, rentan terhadap kesalahan input, dan sulit dikelola saat jumlah tamu meningkat. Diperlukan platform digital yang memudahkan tamu mengisi data dan admin mengelola data kunjungan secara terorganisir.

## 7. Solusi yang Diusulkan

Aplikasi Tamuin menyediakan:

- Formulir isian tamu yang mudah digunakan
- Validasi input agar semua data masuk sesuai format yang benar
- Tampilan daftar tamu untuk admin
- Interface yang responsif untuk mobile dan desktop
- Proses pencatatan kunjungan yang lebih cepat dan akurat

## 8. Fitur Utama

### 8.1 Formulir Input Tamu
Fitur ini memungkinkan tamu mengisi data seperti:
- Nama lengkap
- Nomor identitas (opsional sesuai kebutuhan)
- Instansi / perusahaan
- Tujuan kunjungan
- Nama yang dituju
- Waktu kedatangan
- Catatan tambahan (jika ada)

### 8.2 Validasi Data Input
Sistem akan melakukan validasi sebelum data dikirim, misalnya:
- Nama wajib diisi
- Tujuan kunjungan wajib diisi
- Format email/nomor telepon jika diperlukan
- Mencegah pengisian data kosong atau tidak valid

### 8.3 Daftar Tamu
Admin dapat melihat daftar tamu yang sudah terdaftar, termasuk:
- Nama
- Instansi
- Tujuan
- Waktu datang
- Status kunjungan

### 8.4 Tampilan Responsif
Aplikasi harus dapat digunakan dengan nyaman di:
- Desktop
- Laptop
- Tablet
- Smartphone

## 9. Functional Requirements

### FR-01: Formulir kunjungan
Sistem harus menyediakan formulir untuk tamu mengisi data kunjungan.

### FR-02: Validasi input
Sistem harus memvalidasi field yang wajib diisi dan format data sebelum disimpan.

### FR-03: Pengiriman data
Setelah tamu menekan tombol submit, data harus terkirim ke sistem dan tersimpan.

### FR-04: Daftar tamu
Sistem harus menampilkan daftar tamu yang telah melakukan kunjungan.

### FR-05: Pencarian data
Admin harus dapat mencari tamu berdasarkan nama, instansi, atau tujuan kunjungan.

### FR-06: Tampilan responsif
Antarmuka aplikasi harus menyesuaikan ukuran layar perangkat pengguna.

## 10. Non-Functional Requirements

### NFR-01: Kecepatan
Halaman utama dan formulir harus dimuat dengan cepat.

### NFR-02: Kesederhanaan UI
Antarmuka harus mudah dipahami oleh pengguna awam.

### NFR-03: Keandalan
Data input tidak boleh hilang saat proses pengiriman berlangsung.

### NFR-04: Keamanan
Data tamu harus disimpan dengan aman dan hanya dapat diakses oleh pihak yang berwenang.

### NFR-05: Ketersediaan
Aplikasi harus dapat diakses kapan pun dibutuhkan oleh admin dan tamu.

## 11. User Flow

### 11.1 Flow Tamu
1. Tamu membuka halaman buku tamu
2. Tamu mengisi formulir kunjungan
3. Sistem memvalidasi input
4. Tamu menekan tombol submit
5. Sistem menyimpan data dan menampilkan konfirmasi sukses

### 11.2 Flow Admin
1. Admin membuka halaman daftar tamu
2. Admin melihat data kunjungan terbaru
3. Admin memfilter atau mencari data tamu tertentu
4. Admin mengecek status dan riwayat kunjungan

## 12. Acceptance Criteria

### AC-01
Tamu dapat membuka halaman formulir dan mengisi data dengan benar.

### AC-02
Sistem menampilkan pesan error jika field wajib belum diisi atau format data tidak valid.

### AC-03
Data tamu yang sudah dikirim berhasil muncul di daftar tamu.

### AC-04
Admin dapat melihat daftar tamu di tampilan yang rapi dan mudah dibaca.

### AC-05
Aplikasi dapat diakses dan digunakan dengan baik pada layar desktop maupun mobile.

## 13. Batasan Produk

- Proyek ini fokus pada frontend dahulu, dengan fitur utama berupa input tamu dan daftar kunjungan
- Integrasi backend belum termasuk dalam PRD ini jika belum dibangun
- Fitur logout, autentikasi admin, dan export data dapat ditambahkan pada iterasi berikutnya

## 14. Prihal Pengembangan

### Stack yang Direkomendasikan
- JavaScript / TypeScript
- React / Vue / Svelte (disesuaikan dengan implementasi)
- CSS / Tailwind / Bootstrap

### Struktur Folder
- `src/` - Kode sumber frontend
- `public/` - Aset statis
- `package.json` - Daftar dependensi dan skrip

## 15. Timeline Saran

### Sprint 1
- Setup project
- Pembuatan halaman form tamu
- Validasi input
- Layout dasar

### Sprint 2
- Pembuatan halaman daftar tamu
- Filter dan pencarian
- Responsive design

### Sprint 3
- Perbaikan UI/UX
- Pengujian fitur
- Deployment awal

## 16. Risiko dan Mitigasi

### Risiko 1: Input data tidak valid
Mitigasi: gunakan validasi real-time dan validasi saat submit.

### Risiko 2: Tampilan tidak responsif
Mitigasi: lakukan pengujian di berbagai ukuran layar.

### Risiko 3: Data tidak mudah dikelola
Mitigasi: sediakan struktur data yang jelas dan tampilan list yang terorganisir.

## 17. Kesimpulan

Tamuin merupakan solusi digital yang menyederhanakan proses pencatatan kunjungan, meningkatkan efisiensi kerja admin, serta memberikan pengalaman yang lebih nyaman bagi tamu. Dengan fitur inti berupa formulir tamu, validasi, dan daftar kunjungan yang responsif, aplikasi ini memiliki potensi untuk diterapkan secara luas di berbagai lingkungan kerja.

## 18. Informasi Tambahan

- GitHub: https://github.com/Nadiril
- Status: Frontend project prototype / MVP
- Fokus saat ini: input tamu dan daftar kunjungan

## 19. Catatan Developer

Dokumen ini dapat terus dikembangkan sesuai kebutuhan bisnis. Setelah integrasi backend siap, fitur tambahan seperti autentikasi admin, riwayat kunjungan, export data, dan dashboard analitik dapat ditambahkan ke dalam PRD berikutnya.
