## Aplikasi Pencatat Sederhana (Your-Note)
Aplikasi pencatat sederhana ini dirancang untuk membantu pengguna mengelola catatan harian mereka dengan mudah. Dibangun menggunakan teknologi modern, aplikasi ini menawarkan antarmuka yang bersih dan fungsionalitas inti untuk membuat, melihat, mengedit, dan menghapus catatan.

## Fitur Utama
- Otentikasi Pengguna 
    Pengguna dapat mendaftar (sign-up) dan masuk (sign-in) untuk mengelola catatan pribadi mereka.
- Manajemen Catatan
     Fungsionalitas lengkap untuk membuat, melihat, dan menghapus catatan.

## Teknologi yang Digunakan
- Aplikasi ini dibangun di atas tumpukan teknologi berikut:
    - Frontend:
        1. Vite: Alat bundling modern yang cepat untuk pengembangan frontend.
        2. HTML5, CSS, JavaScript (TypeScript): Dasar dari antarmuka pengguna.
        3. Tailwind CSS: Kerangka kerja CSS untuk styling yang cepat dan konsisten.
    - Backend:
        1. Supabase
            Backend open-source yang menyediakan database PostgreSQL, otentikasi, dan API secara real-time.

## Deployment:
- Vercel: Platform serverless untuk menghosting aplikasi frontend.

## Instalasi dan Pengembangan Lokal
- Untuk menjalankan proyek ini di lingkungan lokal, ikuti langkah-langkah berikut:
    1. Pastikan memiliki:
        - Git
        - Akun Github
        - Visual Studio Code
        - Node.js

    2. Kloning Repositori:
        - git clone https://github.com/your-username/your-repo-name.git
        - cd your-repo-name

    3. Instal Dependensi: npm install

    4. Siapkan Variabel Lingkungan:
        - Buat file .env di root proyek dan tambahkan detail Supabase Anda:
        - VITE_SUPABASE_URL="https://your-supabase-url.supabase.co"
        - VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"

    5. Jalankan Aplikasi: 
        - npm run dev
        - Aplikasi akan berjalan di http://localhost:5173