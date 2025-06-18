import supabase from "./supabase-config";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const TableStorage = <HSR extends { id: string }>(tableName: string) => {
    async function insertData(new_data: Omit<HSR, 'id'>): Promise<string>;
    async function insertData(new_data: HSR): Promise<string>;
    async function insertData(new_data: Partial<HSR>): Promise<string>;

    async function insertData(new_data: any): Promise<string> {
        // // Berikan nilai default jika quantity tidak ada
        if ('id' in new_data && typeof new_data.id === 'string') {
            const modifiedData = { ...new_data, quantity: new_data.quantity ?? 1 } as HSR;
            const { data, error } = await supabase
            .from(tableName)
            .insert([modifiedData])
            .select();

            if (error) throw error;
            return data[0].id;
        } else {
            const { data, error } = await supabase
            .from(tableName)
            .insert([new_data])
            .select();

            if (error) throw error;
            return data[0].id;
        }
    }

    return {
        insertData,
        isInitialize: false as boolean,
        realtimeChannel: null as RealtimeChannel | null,
        currentData: new Map<string, HSR>() as Map<string, HSR>,

        async realtimeInit(callback: (data: HSR[]) => void): Promise<void> {
            if (this.realtimeChannel && this.isInitialize) {
                console.warn(`TableStorage for ${tableName} has been initialized`);
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
                { event: '*', schema: 'public', table: tableName },
                (payload: RealtimePostgresChangesPayload<HSR>) => {
                    switch (payload.eventType) {
                        case 'INSERT': {
                            const newItem = this.processItem(payload.new);
                            this.currentData.set(newItem.id, newItem);
                            break;
                        }
                        case 'UPDATE': {
                            const updatedItem = this.processItem(payload.new);
                            this.currentData.set(updatedItem.id, updatedItem);
                            break;
                        }
                        case 'DELETE': {
                            const deletedId = payload.old.id;
                            if (deletedId) this.currentData.delete(deletedId);
                            break;
                        }
                    }
                    callback(this.toArray());
                }
            );

            const { data, error } = await supabase
            .from(tableName)
            .select('*');

            if (error) {
                console.error('Initial data fetch error:', error);
                callback([]);
                return;
            }

            this.currentData.clear();
            data.forEach(dt => {
                const processed = { ...dt, created_at: new Date(dt.created_at) } as HSR;
                this.currentData.set(processed.id, processed);
            });

            callback(this.toArray());
            this.realtimeChannel.subscribe(); 
            this.isInitialize = true;
        },

        processItem(item: any): HSR {
            if (item && item.created_at && typeof item.created_at === 'string') {
                return { ...item, created_at: new Date(item.created_at) } as HSR;
            }
            return item as HSR;
        },

        async changeSelectedData(id: string, new_data: Partial<Omit<HSR, 'id'>>): Promise<void> {
            const { error } = await supabase
            .from(tableName)
            .update(new_data)
            .eq('id', id);

            if (error) throw error;
        },

        async deleteSelectedData(id: string): Promise<void> {
            const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id);

            if (error) throw error;
        },

        async deleteAllData(): Promise<void> {
            const { error } = await supabase
            .from(tableName)
            .delete()
            .not('id', 'is', null);

            if (error) throw error;
        },

        toArray(): HSR[] {
            return Array.from(this.currentData.values());
        },

        teardownStorage(): void {
            this.currentData.clear();
            this.isInitialize = false;
            if (this.realtimeChannel) {
                this.realtimeChannel.unsubscribe();
                this.realtimeChannel = null;
            }
        }
    }
}

export default TableStorage;