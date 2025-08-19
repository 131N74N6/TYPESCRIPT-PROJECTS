import { supabase } from '../supabase-config';
import TableStorage from '../supabase-table';
import type { Attendance, AttendanceListProps } from '../custom-types';
import Modal from './modal';

export default function AttendanceList(props: AttendanceListProps) {
    const makeModal = Modal(props.notification);
    const attendanceStorage = TableStorage<Attendance>();
    const today = new Date().toISOString().split('T')[0];
    
    async function render() {
        // Dapatkan pengaturan presensi hari ini
        const { data: setting, error: settingError } = await supabase
        .from('attendance_settings')
        .select('id')
        .eq('date', today)
        .single();
        
        if (settingError || !setting) {
            props.container.innerHTML = `
                <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4">
                    <p class="text-yellow-700">Tidak ada pengaturan presensi untuk hari ini.</p>
                </div>
            `;
            return;
        }
        
        // Inisialisasi realtime untuk presensi
        await attendanceStorage.realtimeInit({
            tableName: 'attendances',
            callback: (attendances) => renderList(attendances),
            additionalQuery: (query) => query.eq('setting_id', setting.id)
        });
    }
    
    function renderList(attendances: Attendance[]) {
        if (attendances.length === 0) {
            props.container.innerHTML = `
                <div class="bg-gray-100 border-l-4 border-gray-500 p-4">
                    <p class="text-gray-700">Belum ada presensi yang dicatat.</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIM</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;
        
        attendances.forEach(async (attendance) => {
            // Dapatkan profil mahasiswa
            const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, nip_nim')
            .eq('user_id', attendance.student_id)
            .single();
            
            const studentName = profile?.full_name || 'Unknown';
            const nim = profile?.nip_nim || 'Unknown';
            const time = new Date(attendance.created_at).toLocaleTimeString();
            
            let statusColor = '';
            switch (attendance.status) {
                case 'present': statusColor = 'bg-green-100 text-green-800'; break;
                case 'late': statusColor = 'bg-yellow-100 text-yellow-800'; break;
                case 'permit': statusColor = 'bg-blue-100 text-blue-800'; break;
                case 'absent': statusColor = 'bg-red-100 text-red-800'; break;
            }
            
            html += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">${studentName}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${nim}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                            ${getStatusText(attendance.status)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">${time}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <select data-id="${attendance.id}" class="status-selector border rounded px-2 py-1">
                            <option value="present" ${attendance.status === 'present' ? 'selected' : ''}>Hadir</option>
                            <option value="late" ${attendance.status === 'late' ? 'selected' : ''}>Terlambat</option>
                            <option value="permit" ${attendance.status === 'permit' ? 'selected' : ''}>Izin</option>
                            <option value="absent" ${attendance.status === 'absent' ? 'selected' : ''}>Absen</option>
                        </select>
                    </td>
                </tr>
            `;
        });
        
        html += `</tbody></table>`;
        props.container.innerHTML = html;
        
        // Tambahkan event listener untuk setiap dropdown
        document.querySelectorAll('.status-selector').forEach(select => {
            select.addEventListener('change', async (event) => {
                const attendanceId = (event.target as HTMLSelectElement).dataset.id;
                const newStatus = (event.target as HTMLSelectElement).value;

                if (!attendanceId) return;
                
                try {
                    await attendanceStorage.updateData({
                        tableName: 'attendances',
                        column: 'id',
                        values: attendanceId,
                        newData: { status: newStatus }
                    });
                    
                    makeModal.createModal('Status berhasil diperbarui');
                    makeModal.showMessage();
                } catch (error: any) {
                    makeModal.createModal(`Gagal memperbarui status: ${error.message}`, 'error');
                    makeModal.showMessage();
                }
            }, { signal: props.signal });
        });
    }
    
    function getStatusText(status: string): string {
        switch (status) {
            case 'present': return 'Hadir';
            case 'late': return 'Terlambat';
            case 'permit': return 'Izin';
            case 'absent': return 'Absen';
            default: return status;
        }
    }
    
    return { render }
}