import supabase from './supabase-config';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const DataStorages = <N extends { id: number }>(tableName: string) => {
    async function deleteData(id: number): Promise<void>;
    async function deleteData(id?: number): Promise<void>;

    async function deleteData(id?: number): Promise<void> {
        if (id !== undefined) {
            const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id);

            if (error) throw error
        } else {
            const { error } = await supabase
            .from(tableName)
            .delete()
            .not('id', 'is', null); 

            if (error) throw error
        }
    }

    return {
        currentData: new Map<number, N>() as Map<number, N>,
        isInitialize: false as boolean,
        realtimeChannel: null as RealtimeChannel | null,
        deleteData,

        async realtimeInit(callback: (data: N[]) => void): Promise<void>  {
            if (this.isInitialize && this.realtimeChannel) {
                console.warn(`Storage for ${tableName} has been initialized`);
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
                (payload: RealtimePostgresChangesPayload<N>) => {
                    switch (payload.eventType) {
                        case 'INSERT': {
                            this.currentData.set(payload.new.id, payload.new);
                            break;
                        }
                        case 'UPDATE': {
                            this.currentData.set(payload.new.id, payload.new);
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
            data.forEach(dt => this.currentData.set(dt.id, dt));

            callback(this.toArray());
            this.realtimeChannel.subscribe();
            this.isInitialize = true;
        },

        async addToStorage(data: Omit<N, 'id' | 'created_at'>): Promise<number> {
            const { data: inserted, error } = await supabase
            .from(tableName)
            .insert([data])
            .select();

            if (error) throw error
            return inserted[0].id
        },

        async changeSelectedData(id: number, newData: Partial<Omit<N, 'id'>>): Promise<void> {
            const { error } = await supabase
            .from(tableName)
            .update(newData)
            .eq('id', id);

            if (error) throw error
        },

        toArray(): N[] {
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

export default DataStorages;