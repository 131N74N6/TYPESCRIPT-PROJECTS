import { supabase } from './supabase-config';
import { getSession } from './auth';
import InstructorPage from './instructor';
import StudentPage from './student';
import Modal from './components/modal';

const controller = new AbortController();
const notification = document.getElementById('notification') as HTMLElement;
const makeNotification = Modal(notification);
const appElement = document.getElementById('app') as HTMLElement;

async function initApp() {
    try {
        const session = await getSession();
        
        if (!session) {
            renderLoginForm(appElement, makeNotification);
            return;
        }
        
        const { data: user, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
            
        if (error) throw error;
        
        if (user.role === 'teacher') {
            InstructorPage(appElement, session.user.id).render();
        } else if (user.role === 'student') {
            StudentPage(appElement, session.user.id).render();
        }
    } catch (error: any) {
        makeNotification.createModal(`Error: ${error.message}`, 'error');
        makeNotification.showMessage();
    }
}

function renderLoginForm(appElement: HTMLElement, notification: any) {
    appElement.innerHTML = `
        <div class="flex items-center justify-center min-h-screen">
            <div class="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h1 class="text-2xl font-bold mb-6 text-center">Hello</h1>
                <form id="login-form" class="space-y-4">
                    <div>
                        <label class="block text-gray-700 mb-2">Email</label>
                        <input type="email" id="email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Password</label>
                        <input type="password" id="password" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg">Sign In</button>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('login-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;
        
        try {
            await supabase.auth.signInWithPassword({ email, password });
            location.reload();
        } catch (error: any) {
            notification.createModal(`Login gagal: ${error.message}`, 'error');
            notification.showMessage();
        }
    }, { signal: controller.signal });
}

const teardown = () => { 
    controller.abort();
    makeNotification.teardown();
};

document.addEventListener('DOMContentLoaded', initApp);
window.addEventListener('beforeunload', teardown);