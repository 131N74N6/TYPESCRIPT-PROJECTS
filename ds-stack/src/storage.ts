import supabase from "./supabase-config";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export default class TableStorage<DXD extends { id: string }> {
    protected currentData: Map<string, DXD>;
    protected tableName: string;
    protected channels: RealtimeChannel[] = [];

    constructor(tableName: string) {
        this.tableName = tableName;
        this.currentData = new Map<string, DXD>();
    }

    async realtimeInit(
        callback: (data: DXD[]) => void,
        options?: { initialQuery?: (query: any) => any; onUpdate?: (
            payload: RealtimePostgresChangesPayload<DXD>
        ) => void; }
    ): Promise<RealtimeChannel[]> {
        const channel = supabase.channel('table_' + this.tableName);
        
        // Setup realtime listener await
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: this.tableName },
            (payload: RealtimePostgresChangesPayload<DXD>) => {
                this.handlePayloadChange(payload);
                if (options?.onUpdate) options.onUpdate(payload);
                callback(Array.from(this.currentData.values()));
            }
        );

        try {
            let query = supabase
            .from(this.tableName)
            .select('*');

            if (options?.initialQuery) query = options.initialQuery(query);

            const { data, error } = await query;

            if (error) throw new Error(`Error fetching data: ${error.message}`);

            this.currentData.clear();
            data.forEach(dt => {
                const processed = this.processData(dt);
                this.currentData.set(processed.id, processed);
            });

            callback(Array.from(this.currentData.values()));
            channel.subscribe();
        } catch (error) {
            console.error(`Initialization error for table ${this.tableName}:`, error);
            callback([]);
        }

        this.channels.push(channel);
        return [channel];
    }

    protected processData(data: any): DXD {
        if (data.created_at && typeof data.created_at === 'string') {
            return { ...data, created_at: new Date(data.created_at) } as DXD;
        }
        return data as DXD;
    }

    private handlePayloadChange(payload: RealtimePostgresChangesPayload<DXD>): void {
        switch (payload.eventType) {
            case "INSERT": {
                const newData = this.processData(payload.new);
                this.currentData.set(newData.id, newData);
                break;
            }
            case "UPDATE": {
                const changeData = this.processData(payload.new);
                this.currentData.set(changeData.id, changeData);
                break;
            }
            case "DELETE": {
                const deletedId = payload.old.id;
                if (deletedId) this.currentData.delete(deletedId);
                break;
            }
        }
    }

    async push(item: Omit<DXD, 'id'>): Promise<void> {
        const { data, error } = await supabase
        .from(this.tableName)
        .insert([item])
        .select(); // Mengembalikan data yang baru saja dimasukkan

        if (error) throw new Error(error.message);

        return data[0].id;
    }

    // Mengambil data dari stack (dan menghapusnya dari Supabase)
    async pop(): Promise<DXD | undefined> {
        if (await this.isEmpty()) return undefined;

        // Dapatkan item terbaru
        const { data, error } = await supabase
        .from(this.tableName)
        .select('id, data, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

        if (error) throw new Error(`Failed to pop: ${error.message}`);
        if (!data || data.length === 0) return undefined;

        const topItem = data[0];
        
        // Hapus item
        const { error: deleteError } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', topItem.id);

        if (deleteError) throw new Error(`Failed to delete: ${deleteError.message}`);

        this.currentData.delete(topItem.id);
        return topItem.data as DXD; // Kembalikan data langsung
    }

    // Melihat data teratas (dari Supabase)
    async peek(): Promise<DXD | undefined> {
        if (await this.isEmpty()) return;
        
        const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false }) // Ambil yang terbaru
        .limit(1);

        if (error) throw new Error('Error peeking item from Supabase: ${error.message}');

        if (!data || data.length === 0) return undefined;

        return data[0].value as DXD;
    }

    // Mengecek apakah stack kosong (dengan memeriksa Supabase)
    async isEmpty(): Promise<boolean> {
        const { count, error } = await supabase
            .from(this.tableName)
            .select('*', { count: 'exact', head: true }); // Hanya hitung jumlah

        if (error) {
            console.error('Error checking if stack is empty:', error.message);
            return true; // Asumsikan kosong jika ada error
        }
        return count === 0;
    }

    // Mengambil semua data (dari Supabase, diurutkan)
    async getItems(): Promise<DXD[]> {
        const { data, error } = await supabase
        .from(this.tableName)
        .select('value')
        .order('created_at', { ascending: false }); // Urutan LIFO untuk mendapatkan items

        if (error) {
            console.error('Error getting all items from Supabase:', error.message);
            return [];
        }
        return data.map(item => item.value as DXD);
    }

    // Membersihkan stack (menghapus semua dari Supabase dan Map)
    async clear(): Promise<void> {
        const { error } = await supabase
        .from(this.tableName)
        .delete()
        .not('id', 'is', null); // Hapus semua (gunakan kondisi yang selalu true untuk menghapus semua)

        if (error) throw new Error(error.message);
        
        this.currentData.clear();
    }

    teardown(): void {
        this.channels.forEach(channel => supabase.removeChannel(channel));
        this.channels = [];
        this.currentData.clear();
    }
}