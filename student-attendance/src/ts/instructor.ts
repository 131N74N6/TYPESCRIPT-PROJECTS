import { supabase } from './supabase-config';
import TableStorage from './supabase-table';
import { getSession } from './auth';
import { getUserProfile, updateProfile } from './auth';
import type { Attendance, Profile } from './custom-types';
import Modal from './components/modal';
import AttendanceList from './components/attendance-list';
import SettingsForm from './components/setting-form';

export default function InstructorPage(appElement: HTMLElement, userId: string) {
    const controller = new AbortController();
    const notification = Modal(document.getElementById('notification') as HTMLElement);
    const attendanceStorage = TableStorage<Attendance>();
    const profileStorage = TableStorage<Profile>();
    const profileTable = 'attendance_profiles';

    async function render() {
        const session = await getSession();
        if (!session) return;
        
        const profile = await getUserProfile(userId);
        
        appElement.innerHTML = `
            <div class="container mx-auto p-4">
                <header class="bg-white shadow-md p-4 rounded-lg mb-6 flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold">Dashboard Dosen</h1>
                        <p class="text-gray-600">${profile.full_name} (${profile.nim})</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <button id="profile-btn" class="bg-gray-200 hover:bg-gray-300 p-2 rounded-full">
                            <i class="fas fa-user"></i>
                        </button>
                        <button id="logout-btn" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Logout</button>
                    </div>
                </header>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="col-span-1">
                        <div class="bg-white shadow-md rounded-lg p-6">
                            <h2 class="text-xl font-semibold mb-4">Pengaturan Presensi</h2>
                            <div id="settings-form"></div>
                        </div>
                    </div>

                    <div class="col-span-2">
                        <div class="bg-white shadow-md rounded-lg p-6">
                            <h2 class="text-xl font-semibold mb-4">Daftar Presensi Hari Ini</h2>
                            <div id="attendance-list"></div>
                        </div>
                    </div>
                </div>

                <div id="profile-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 p-4">
                    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-semibold">Edit Profil</h3>
                            <button id="close-profile-modal" class="text-gray-500 hover:text-gray-700">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form id="profile-form" class="space-y-4">
                            <div>
                                <label class="block text-gray-700 mb-2">Nama Lengkap</label>
                                <input type="text" id="full-name" value="${profile.full_name}" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-gray-700 mb-2">NIP</label>
                                <input type="text" id="nim" value="${profile.nim}" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-gray-700 mb-2">Kelas</label>
                                <input type="text" id="class" value="${profile.class}" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg">Simpan</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Event listeners
        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            await supabase.auth.signOut();
            location.reload();
        }, { signal: controller.signal });

        document.getElementById('profile-btn')?.addEventListener('click', () => {
            (document.getElementById('profile-modal') as HTMLDivElement).classList.remove('hidden');
        }, { signal: controller.signal });

        document.getElementById('close-profile-modal')?.addEventListener('click', () => {
            (document.getElementById('profile-modal') as HTMLDivElement).classList.add('hidden');
        }, { signal: controller.signal });

        document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const fullName = (document.getElementById('full-name') as HTMLInputElement).value;
                const nim = (document.getElementById('nim') as HTMLInputElement).value;
                const className = (document.getElementById('class') as HTMLInputElement).value;
                
                await profileStorage.updateData({
                    tableName: profileTable,
                    values: userId,
                    column: 'user_id',
                    newData: {
                        full_name: fullName,
                        nim: nim,
                        class: className
                    }
                });
                
                notification.createModal('Profil berhasil diperbarui');
                notification.showMessage();
                (document.getElementById('profile-modal') as HTMLDivElement).classList.add('hidden');
                render();
            } catch (error: any) {
                notification.createModal(`Error: ${error.message || error}`);
                notification.showMessage();
            }
        }, { signal: controller.signal });

        // Render components
        SettingsForm(document.getElementById('settings-form') as HTMLFormElement, userId, notification);
        AttendanceList(document.getElementById('attendance-list') as HTMLElement, notification);
    }

    const teardown = () => controller.abort();

    return { render, teardown }
}