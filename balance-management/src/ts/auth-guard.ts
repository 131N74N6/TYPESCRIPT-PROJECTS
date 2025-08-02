import { getSession, onAuthStateChange, signOut as supabaseSignOut } from './supabase-config';

const publicRoutes = ['/html/signin.html', '/html/signup.html'];

async function checkAuthAndRedirect() {
    const currentPath = window.location.pathname;
    const session = await getSession();

    // Jika pengguna sudah login
    if (session) {
        // Jika sedang di halaman publik (signin/signup/index) dan sudah login, arahkan ke user.html
        if (publicRoutes.includes(currentPath)) {
            window.location.replace('/html/user.html');
            return;
        }
    } else { // Jika pengguna belum login
        // Jika tidak di halaman publik, dan belum login, arahkan ke signin.html
        if (!publicRoutes.includes(currentPath)) {
            window.location.replace('/html/signin.html');
            return;
        }
    }
}

// Jalankan pemeriksaan saat DOMContentLoaded
document.addEventListener('DOMContentLoaded', checkAuthAndRedirect);

// Tambahkan event listener untuk tombol sign-out di mana pun ia berada
document.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    if (target && target.id === 'sign-out') {
        try {
            await supabaseSignOut();
            // Setelah sign-out, auth-guard akan mendeteksi tidak ada sesi dan mengarahkan ke signin.html
            // Tidak perlu redirect eksplisit di sini karena sudah ditangani oleh onAuthStateChange
        } catch (error) {
            alert('Failed to sign out. Please try again.'); // Gunakan modal Anda jika ada
        }
    }
});

// Dengarkan perubahan state autentikasi secara real-time
onAuthStateChange((event) => {
    // Jika event adalah SIGNED_OUT, otomatis arahkan ke signin.html
    if (event === 'SIGNED_OUT') {
        window.location.replace('/html/signin.html');
    }
    // Jika SIGNED_IN, checkAuthAndRedirect akan menangani pengarahan jika perlu
    checkAuthAndRedirect();
});