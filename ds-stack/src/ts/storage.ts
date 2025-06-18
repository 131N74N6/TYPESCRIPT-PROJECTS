import supabase from "./supabase-config";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export default class TableStorage<DXD extends { id: string }> {
    protected currentData: Map<string, DXD>;
    protected tableName: string;
    private isInitialized: boolean = false;
    private realtimeChannel: RealtimeChannel | null = null;

    constructor(tableName: string) {
        this.tableName = tableName;
        this.currentData = new Map<string, DXD>();
    }

    protected async realtimeInit(
        callback: (data: DXD[]) => void, initialQuery?: (query: any) => any): Promise<void> {
        if (this.isInitialized && this.realtimeChannel) {
            console.warn(`Realtime channel for table ${this.tableName} is already initialized.`);
            callback(this.toArray());
            return;
        }

        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }

        this.realtimeChannel = supabase.channel('any');
        this.realtimeChannel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: this.tableName },
            (payload: RealtimePostgresChangesPayload<DXD>) => {

                switch(payload.eventType) {
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
                        if (deletedId) {
                            this.currentData.delete(deletedId);
                        }
                        break;
                    }
                }
                callback(Array.from(this.currentData.values()));
            }
        );

        try {
            let query = supabase
            .from(this.tableName)
            .select('*');

            if (initialQuery) query = initialQuery(query);

            const { data, error } = await query;

            if (error) {
                callback([]);
                throw new Error(`Error fetching data: ${error.message}`);
            }

            this.currentData.clear();
            data.forEach(dt => {
                const processed = { ...dt, created_at: new Date(dt.created_at) } as DXD;
                this.currentData.set(processed.id, processed);
            });

            callback(Array.from(this.currentData.values()));
            this.realtimeChannel.subscribe();
            this.isInitialized = true;
        } catch (error) {
            callback([]);
            throw new Error(`Failed to show data: ${error}`);
        }
    }

    protected processData(data: any): DXD {
        if (data && data.created_at && typeof data.created_at === 'string') {
            return { ...data, created_at: new Date(data.created_at) } as DXD;
        }
        return data as DXD;
    }

    protected async push(item: Omit<DXD, 'id'>): Promise<string> {
        const { data, error } = await supabase
        .from(this.tableName)
        .insert([item])
        .select(); 

        if (error) throw error;

        return data[0].id;
    }

    // Mengambil data teratas (LIFO) dari Supabase dan menghapusnya
    protected async pop(): Promise<DXD | undefined> {
        if (await this.isEmpty()) return undefined;

        const { data, error } = await supabase
        .from(this.tableName)
        .select('*') // Pilih semua kolom
        .order('created_at', { ascending: false }) 
        .limit(1);

        if (error) throw error;

        const topItem = data[0];
        
        const { error: deleteError } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', topItem.id);

        if (deleteError) throw new Error(`Failed to delete item for pop: ${deleteError.message}`);
        return this.processData(topItem);
    }

    // Melihat data teratas (LIFO) dari Supabase tanpa menghapusnya
    async peek(): Promise<DXD | undefined> {
        if (await this.isEmpty()) return undefined;
        
        const { data, error } = await supabase
        .from(this.tableName)
        .select('*') // Pilih semua kolom
        .order('created_at', { ascending: false }) // Ambil yang terbaru
        .limit(1);

        if (error) throw error;
        if (!data || data.length === 0) return undefined;

        return this.processData(data[0]); // Kembalikan data yang sudah diproses
    }

    async isEmpty(): Promise<boolean> {
        const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

        if (error) throw error;
        
        return count === 0;
    }

    protected async changeSelectedData(id: string, item: Partial<Omit<DXD, 'id'>>): Promise<void> {
        const { error } = await supabase
        .from(this.tableName)
        .update(item)
        .eq('id', id);

        if (error) throw error;
    }

    async clear(): Promise<void> {
        const { error } = await supabase
        .from(this.tableName)
        .delete()
        .not('id', 'is', null); // Kondisi untuk menghapus semua baris

        if (error) throw error;
    }

    teardownTable(): void {
        this.currentData.clear();
        this.isInitialized = false;
        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }
    }

    protected toArray(): DXD[] {
        return Array.from(this.currentData.values());
    }
}