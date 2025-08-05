import { getSession, onAuthStateChange, signOut as supabaseSignOut } from './supabase-config';

const publicRoutes = ['/html/signin.html', '/html/signup.html'];
let authUnsubscribe: (() => void) | null = null;
let isCheckingAuth = false;

const handleRedirect = (sessionExists: boolean) => {
    const currentPath = window.location.pathname;
    const isPublicRoute = publicRoutes.includes(currentPath);
    
    if (sessionExists && isPublicRoute) {
        window.location.href = '/html/home.html';
    } else if (!sessionExists && !isPublicRoute) {
        window.location.href = '/html/signin.html';
    }
}

// Centralized auth check
const checkAuth = async () => {
    if (isCheckingAuth) return;
    isCheckingAuth = true;
    
    try {
        const session = await getSession();
        handleRedirect(!!session);
    } catch (error) {
        console.error('Auth check failed:', error);
        // Fallback to public route on error
        if (!publicRoutes.includes(window.location.pathname)) {
            window.location.href = '/html/signin.html';
        }
    } finally {
        isCheckingAuth = false;
    }
}

// Initialize auth guard
function initAuthGuard(): void {
    // Initial check
    checkAuth();
    
    // Auth state listener
    authUnsubscribe = onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
            handleRedirect(false);
        } else if (event === 'SIGNED_IN') {
            handleRedirect(true);
        }
    });
    
    // Targeted sign-out listener
    document.getElementById('sign-out')?.addEventListener('click', async () => {
        try {
            await supabaseSignOut();
        } catch (error) {
            console.error('Sign out failed:', error);
            alert('Failed to sign out. Please try again.');
        }
    });
}

function cleanupAuthGuard() {
    if (authUnsubscribe) authUnsubscribe();
    document.getElementById('sign-out')?.removeEventListener('click', supabaseSignOut);
}

document.addEventListener('DOMContentLoaded', initAuthGuard);
window.addEventListener('beforeunload', cleanupAuthGuard);