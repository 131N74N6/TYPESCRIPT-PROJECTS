import { getSession, onAuthStateChange, signOut } from "./supabase-config";

const publicRoute = ['/html/signin.html', '/html/signup.html'];
let authUnsubscribe: (() => void) | null = null;
let isCheckingAuth: boolean = false;

function handleRedirect(sessionExist: boolean): void {
    const currentPath = window.location.pathname;
    const isPublicRoute = publicRoute.includes(currentPath);

    if (sessionExist && isPublicRoute) {
        window.location.href = '/html/home.html';
    } else if (!sessionExist && !isPublicRoute) {
        window.location.href = '/html/signin.html';
    }
}

async function checkingAuth(): Promise<void> {
    if (isCheckingAuth) return;
    isCheckingAuth = true;

    try {
        const session = await getSession();
        handleRedirect(!!session);
    } catch (error) {
        console.log(`Error: ${error}`);
        if (!publicRoute.includes(window.location.pathname)) {
            window.location.href = '/html/signin.html';
        }
    } finally {
        isCheckingAuth = false;
    }
}

function initAuthGuard() {
    checkingAuth();
    authUnsubscribe = onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') handleRedirect(false);
        else if (event === 'SIGNED_IN') handleRedirect(true);
    });
    document.getElementById('sign-out')?.addEventListener('click', async () => {
        try {
            await signOut();
        } catch (error) {
            alert('Failed to sign out. Please try again.');
        }
    });
}

function cleanupAuthGuard() {
    if (authUnsubscribe) authUnsubscribe();
    document.getElementById('sign-out')?.removeEventListener('click', signOut);
}

document.addEventListener('DOMContentLoaded', initAuthGuard);
window.addEventListener('beforeunload', cleanupAuthGuard);