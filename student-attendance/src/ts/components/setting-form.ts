import { supabase } from '../supabase-config';
import TableStorage from '../supabase-table';
import type { AttendanceSetting } from '../custom-types';
import Modal from './modal';

export default function SettingsForm(container: HTMLElement, userId: string, notification: HTMLElement) {
    const settingStorage = TableStorage<AttendanceSetting>();
    const attendanceSettingTable = 'attendance_settings';
    const today = new Date().toISOString().split('T')[0];
    const makeNotification = Modal(notification);
    const controller = new AbortController();
    
    async function render() {
        // Cek apakah sudah ada pengaturan untuk hari ini
        const { data: existingSetting } = await supabase
        .from('attendance_settings')
        .select('*')
        .eq('date', today)
        .single();
        
        container.innerHTML = `
            <form id="settings-form-inner" class="space-y-4">
                <div>
                    <label class="block text-gray-700 mb-2">Tanggal</label>
                    <input type="date" id="date" value="${today}" required class="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled>
                </div>
                <div>
                    <label class="block text-gray-700 mb-2">Waktu Mulai</label>
                    <input type="time" id="start-time" value="${existingSetting?.start_time || '07:00'}" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                    <label class="block text-gray-700 mb-2">Waktu Selesai</label>
                    <input type="time" id="end-time" value="${existingSetting?.end_time || '08:00'}" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg">
                    ${existingSetting ? 'Perbarui Pengaturan' : 'Simpan Pengaturan'}
                </button>
            </form>
        `;
        
        document.getElementById('settings-form-inner')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const date = (document.getElementById('date') as HTMLInputElement).value;
                const startTime = (document.getElementById('start-time') as HTMLInputElement).value;
                const endTime = (document.getElementById('end-time') as HTMLInputElement).value;
                
                if (existingSetting) {
                    await settingStorage.updateData({
                        tableName: attendanceSettingTable,
                        column: 'id',
                        values: existingSetting.id,
                        newData: {
                            start_time: startTime,
                            end_time: endTime
                        }
                    });
                } else {
                    await settingStorage.insertData({
                        tableName: attendanceSettingTable,
                        newData: {
                            user_id: userId,
                            date: date,
                            start_time: startTime,
                            end_time: endTime
                        }
                    });
                }
                
                makeNotification.createModal('Pengaturan berhasil disimpan');
                makeNotification.showMessage();
            } catch (error: any) {
                makeNotification.createModal(`Gagal menyimpan pengaturan: ${error.message}`, 'error');
                makeNotification.showMessage();
            }
        }, { signal: controller.signal });
    }

    const teardown = () => controller.abort();

    return { render, teardown }
}