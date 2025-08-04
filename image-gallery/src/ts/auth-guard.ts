import { getSession, onAuthStateChange, signOut as supabaseSignOut } from './supabase-config';

const publicRoutes = ['/html/signin.html', '/html/signup.html'];
let authUnsubscribe: (() => void) | null = null;
let isCheckingAuth = false;

// Handle redirect logic
const handleRedirect = (sessionExists: boolean) => {
    const currentPath = window.location.pathname;
    const isPublicRoute = publicRoutes.includes(currentPath);
    
    if (sessionExists && isPublicRoute) {
        window.location.href = '/html/user.html';
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
        if (!publicRoutes.includes(window.location.pathname)) {
            window.location.href = '/html/signin.html';
        }
    } finally {
        isCheckingAuth = false;
    }
}

const initAuthGuard = () => {
    checkAuth();
    
    // Auth state listener
    authUnsubscribe = onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
            handleRedirect(false);
        } else if (event === 'SIGNED_IN') {
            handleRedirect(true);
        }
    });
    
    document.getElementById('sign-out')?.addEventListener('click', async () => {
        try {
            await supabaseSignOut();
        } catch (error) {
            console.error('Sign out failed:', error);
            alert('Failed to sign out. Please try again.');
        }
    });
}

const cleanupAuthGuard = () => {
    if (authUnsubscribe) authUnsubscribe();
    document.getElementById('sign-out')?.removeEventListener('click', supabaseSignOut);
}

document.addEventListener('DOMContentLoaded', initAuthGuard);
window.addEventListener('beforeunload', cleanupAuthGuard);