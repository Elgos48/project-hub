# Project Hub — Open Source Project Repository Platform

Project Hub adalah platform berbasis web (*Full-Stack*) yang dirancang khusus sebagai wadah bagi komunitas pengembang teknologi untuk mempublikasikan, mendokumentasikan, serta mendistribusikan proyek *open-source* mereka. 

Aplikasi ini mengintegrasikan arsitektur **RESTful API** menggunakan **Node.js (Express.js)** pada sisi *backend*, sistem manajemen database **MySQL** sebagai media penyimpanan relasional, serta antarmuka dinamis berbasis **Vanilla JavaScript (ES6+)** dan **HTML5/CSS3 Custom Properties** pada sisi *frontend*.

---

## 💎 Fitur Utama Sistem

### 1. Robust Authentication & Authorization
- **Security First:** Enkripsi *password* searah menggunakan algoritma **Bcrypt** dengan *salt rounds* adaptif sebelum masuk ke database.
- **Stateless Session Management:** Menggunakan **JSON Web Tokens (JWT)** yang dikirimkan via HTTP Header `Authorization` untuk otentikasi mandiri.
- **Granular Access Control:** Pembatasan hak akses berlapis (*Authorization*). Hanya *user* pemilik proyek yang memiliki izin untuk melakukan operasi penghapusan (`DELETE`) data dan file fisik di server.

### 2. Advanced File Handling & Storage Management
- **Disk Storage Streamlining:** Integrasi middleware **Multer** untuk melakukan pengolahan dan penamaan ulang file (*image thumbnail* dan *source code archive*) secara unik menggunakan *timestamp* unik berbasis milidetik.
- **Database Optimization:** Database hanya menyimpan *string reference path* dari file, menjaga ukuran database tetap ringan dan performa kueri tetap optimal.
- **Automated Garbage Collection:** Ketika proyek dihapus, backend secara otomatis memicu metode `fs.unlink()` untuk menghapus berkas fisik terkait di folder `uploads/` guna mencegah penumpukan berkas sampah (*storage bloat*).

---

## 🛠️ Stack Teknologi

| Lapisan Sistem | Teknologi / Modul | Deskripsi / Fungsi |
| :--- | :--- | :--- |
| **Frontend** | HTML5 / CSS3 / ES6+ JavaScript | Antarmuka responsif menggunakan Flexbox/Grid & API Fetch dinamis. |
| **Backend** | Node.js / Express.js | Framework penanganan routing HTTP, Middleware, dan RESTful API. |
| **Database** | MySQL | Penyimpanan relasional untuk entitas Pengguna (*Users*) & Proyek (*Projects*). |
| **Driver DB** | `mysql2` | Konektor database berperforma tinggi yang mendukung *prepared statements*. |
| **Keamanan** | `bcrypt` & `jsonwebtoken` | Enkripsi kredensial pengguna dan manajemen token otentikasi sesi. |
| **File Engine**| `multer` | Penanganan data formulir multi-bagian (*multipart/form-data*) untuk unggah file. |
| **Konfigurasi**| `dotenv` & `cors` | Pengelolaan variabel lingkungan terisolasi dan izin akses silang asal (*Cross-Origin*). |

---

## 📁 Struktur Direktori Proyek

```text
project-hub/
├── node_modules/         # Dependensi pihak ketiga Node.js (diabaikan oleh Git)
├── public/               # File statis frontend yang dilayani oleh Express
│   ├── Index.html        # Dasbor utama, grid proyek, dan modal unggah
│   ├── Project.html      # Halaman render detail dokumen proyek spesifik
│   ├── Login.html        # Antarmuka otentikasi masuk pengguna
│   ├── Register.html     # Antarmuka registrasi pembuatan akun baru
│   ├── Style.css         # Struktur desain global, variabel CSS, dan tema komponen
│   └── Script.js         # Pengolah logika interaksi UI klien dan konsumsi REST API
├── uploads/              # Direktori penyimpanan terisolasi untuk file fisik user (.png, .zip)
├── .env                  # Environment Variables rahasia lokal (Wajib di-ignore!)
├── .env.example          # Cetak biru variabel lingkungan untuk replikasi tim
├── .gitignore            # Direktori instruksi eksklusi pelacakan Git
├── package.json          # Manifest proyek, metadata, skrip, dan deklarasi dependensi
├── package-lock.json     # Catatan versi detail penguncian dependensi
└── server.js             # Titik masuk utama (Entry Point) backend dan arsitektur API
```
---

## ⚙️ Panduan Instalasi & Konfigurasi Lokal
### 1. Kloning Repositori & Instalasi Dependensi
Ekstrak atau kloning repositori dari GitHub, masuk ke direktori utama, lalu instal seluruh dependensi yang tertera pada manifes package.json:

```Bash
git clone [https://github.com/username/project-hub.git](https://github.com/username/project-hub.git)
cd project-hub
npm install
```
### 2. Konfigurasi Skema Database Relasional
Pastikan layanan database MySQL Anda (misal: XAMPP / Laragon) telah aktif. Akses perangkat administrasi database Anda (phpMyAdmin / HeidiSQL), buat database baru bernama projecthub, lalu eksekusi struktur DDL (Data Definition Language) berikut:

```SQL
SQL
CREATE DATABASE projecthub;
USE projecthub;

-- Entitas Tabel Pengguna (Users)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Entitas Tabel Proyek (Projects) dengan Relasi Foreign Key
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    text_desc TEXT NOT NULL,
    tech_use VARCHAR(255) DEFAULT '',
    code_zip_path VARCHAR(255) DEFAULT NULL,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. Setup Variabel Lingkungan Sistem (.env)
Buat berkas baru .env di direktori root proyek (sejajar dengan server.js). Definisikan konfigurasi sistem sebagai berikut:

```plaintext
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=masukkan_password_mysql_lokal_anda
DB_NAME=projecthub
JWT_SECRET=YOUR_RANDOM_KEY_STRING
```

### 4. Penyediaan Direktori Unggah
Pastikan folder penampung file fisik telah tersedia di direktori utama Anda. Jika belum ada, buat folder baru bernama uploads:

```Bash
mkdir uploads
```
---

## 🏃‍♂️ Cara Menjalankan Aplikasi
```Bash
npm start
```

```Plaintext
Connected to MySQL database
Server running on port 3000
```
Buka browser: http://localhost:3000