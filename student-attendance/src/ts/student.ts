import { supabase } from './supabase-config';
import TableStorage from './supabase-table';
import { getSession, signOut, getUserProfile } from './auth';
import type { Attendance, Profile } from './custom-types';
import Modal from './components/modal';

export default function StudentPage(appElement: HTMLElement, userId: string) {
    const controllers: AbortController[] = [];
    const notification = Modal(document.getElementById('notification') as HTMLElement);
    const attendanceStorage = TableStorage<Attendance>();
    const profileStorage = TableStorage<Profile>();
    const attendanceTable = 'attendances';
    const profileTable = 'profiles';

    function cleanupEventListeners() {
        controllers.forEach(controller => controller.abort());
        controllers.length = 0;
    }

    async function render() {
        cleanupEventListeners();

        const session = await getSession();
        if (!session) {
            window.location.href = '/';
            return;
        }
        
        const profile = await getUserProfile(userId);

        const currentController = new AbortController();
        controllers.push(currentController);
        const { signal } = currentController;
        
        appElement.innerHTML = `
            <div class="container mx-auto p-4">
                <header class="bg-white shadow-md p-4 rounded-lg mb-6 flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold">Dashboard Mahasiswa</h1>
                        <p class="text-gray-600">${profile.full_name} (${profile.nip_or_nim})</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <button id="profile-btn" class="bg-gray-200 hover:bg-gray-300 p-2 rounded-full">
                            <i class="fas fa-user"></i>
                        </button>
                        <button id="logout-btn" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Logout</button>
                    </div>
                </header>

                <div class="bg-white shadow-md rounded-lg p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4">Presensi Hari Ini</h2>
                    <div id="attendance-status" class="mb-4"></div>
                    <div id="attendance-form"></div>
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
                                <label class="block text-gray-700 mb-2">NIM</label>
                                <input type="text" id="nip_or_nim" value="${profile.nip_or_nim}" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
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
            await signOut();
            window.location.href = '/';
        }, { signal });

        document.getElementById('profile-btn')?.addEventListener('click', () => {
            (document.getElementById('profile-modal') as HTMLDivElement).classList.remove('hidden');
        }, { signal });

        document.getElementById('close-profile-modal')?.addEventListener('click', () => {
            (document.getElementById('profile-modal') as HTMLDivElement).classList.add('hidden');
        }, { signal });

        document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const fullName = (document.getElementById('full-name') as HTMLInputElement).value;
                const nipOrNim = (document.getElementById('nip_or_nim') as HTMLInputElement).value;
                const className = (document.getElementById('class') as HTMLInputElement).value;
                
                await profileStorage.updateData({
                    tableName: profileTable,
                    column: 'user_id',
                    values: userId,
                    newData: {
                        full_name: fullName,
                        nip_or_nim: nipOrNim,
                        class: className
                    }
                });
                
                notification.createModal('Profile Successfully Updated!');
                notification.showMessage();
                (document.getElementById('profile-modal') as HTMLDivElement).classList.add('hidden');
                render();
            } catch (error: any) {
                notification.createModal(`Gagal memperbarui profil: ${error.message}`, 'error');
                notification.showMessage();
            }
        }, { signal });

        // Render attendance status
        await renderAttendanceStatus();
    }

    async function renderAttendanceStatus() {
        const today = new Date().toISOString().split('T')[0];
        const statusElement = document.getElementById('attendance-status') as HTMLElement;
        const formElement = document.getElementById('attendance-form') as HTMLDivElement;
        
        try {
            // Cek apakah ada pengaturan presensi hari ini
            const { data: setting, error: settingError } = await supabase
                .from('attendance_settings')
                .select('*')
                .eq('date', today)
                .single();
            
            if (settingError || !setting) {
                statusElement.innerHTML = `
                    <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4">
                        <p class="text-yellow-700">Tidak ada jadwal presensi hari ini.</p>
                    </div>
                `;
                formElement.innerHTML = '';
                return;
            }
            
            // Cek apakah mahasiswa sudah melakukan presensi
            const { data: attendance, error: attendanceError } = await supabase
                .from(attendanceTable)
                .select('*')
                .eq('student_id', userId)
                .eq('setting_id', setting.id)
                .single();

            if (attendanceError && attendanceError.code !== 'PGRST116') {
                console.error('Attendance error:', attendanceError);
            }
            
            if (attendance) {
                let statusClass = '';
                let statusText = '';
                
                switch (attendance.status) {
                    case 'present':
                        statusClass = 'bg-green-100 border-green-500 text-green-700';
                        statusText = 'Hadir';
                        break;
                    case 'late':
                        statusClass = 'bg-yellow-100 border-yellow-500 text-yellow-700';
                        statusText = 'Terlambat';
                        break;
                    case 'permit':
                        statusClass = 'bg-blue-100 border-blue-500 text-blue-700';
                        statusText = 'Izin';
                        break;
                    case 'absent':
                        statusClass = 'bg-red-100 border-red-500 text-red-700';
                        statusText = 'Absen';
                        break;
                }
                
                statusElement.innerHTML = `
                    <div class="border-l-4 ${statusClass} p-4">
                        <p>Status presensi: <strong>${statusText}</strong></p>
                        <p>Waktu: ${new Date(attendance.created_at).toLocaleTimeString()}</p>
                    </div>
                `;
                formElement.innerHTML = '';
                return;
            }
            
            // Tampilkan form presensi jika belum melakukan presensi
            const now = new Date();
            const startTime = new Date(`${today}T${setting.start_time}`);
            const endTime = new Date(`${today}T${setting.end_time}`);
            
            if (now < startTime) {
                statusElement.innerHTML = `
                    <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4">
                        <p class="text-yellow-700">Presensi akan dibuka pada ${startTime.toLocaleTimeString()}</p>
                    </div>
                `;
                formElement.innerHTML = '';
            } else if (now > endTime) {
                statusElement.innerHTML = `
                    <div class="bg-red-100 border-l-4 border-red-500 p-4">
                        <p class="text-red-700">Presensi sudah ditutup pada ${endTime.toLocaleTimeString()}</p>
                    </div>
                `;
                formElement.innerHTML = '';
            } else {
                statusElement.innerHTML = `
                    <div class="bg-blue-100 border-l-4 border-blue-500 p-4">
                        <p class="text-blue-700">Silakan lakukan presensi</p>
                    </div>
                `;
                
                formElement.innerHTML = `
                    <form id="attendance-form-inner" class="space-y-4">
                        <div>
                            <label class="block text-gray-700 mb-2">Status</label>
                            <select id="attendance-status-select" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                <option value="present">Hadir</option>
                                <option value="permit">Izin</option>
                            </select>
                        </div>
                        <button type="submit" class="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg">Submit Presensi</button>
                    </form>
                `;
                
                const formController = new AbortController();
                controllers.push(formController);
                
                document.getElementById('attendance-form-inner')?.addEventListener('submit', async (event) => {
                    event.preventDefault();
                    try {
                        const status = (document.getElementById('attendance-status-select') as HTMLSelectElement).value;
                        
                        await attendanceStorage.insertData({
                            tableName: attendanceTable,
                            newData: {
                                student_id: userId,
                                setting_id: setting.id,
                                status: status
                            }
                        });
                        
                        notification.createModal('Presensi berhasil dicatat');
                        notification.showMessage();
                        render();
                    } catch (error: any) {
                        notification.createModal(`Gagal mencatat presensi: ${error.message}`, 'error');
                        notification.showMessage();
                    }
                }, { signal: formController.signal });
            }
        } catch (error: any) {
            console.error('Error in renderAttendanceStatus:', error);
            notification.createModal(`Error: ${error.message}`, 'error');
            notification.showMessage();
        }
    }

    const teardown = () => {
        cleanupEventListeners();
        attendanceStorage.teardownDatabase();
        profileStorage.teardownDatabase();
    };

    return { render, teardown };
}