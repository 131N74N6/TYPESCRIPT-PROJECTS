import { supabase } from './supabase-config';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { DatabaseProps } from './custom-types';

const DataStorages = <N extends { id: string }>(tableName: string) => {
    async function deleteData(id: string): Promise<void>;
    async function deleteData(id?: string): Promise<void>;

    async function deleteData(id?: string): Promise<void> {
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

            if (error) throw error.message;
        }
    }

    return {
        currentData: new Map<string, N>() as Map<string, N>,
        isInitialize: false as boolean,
        realtimeChannel: null as RealtimeChannel | null,
        deleteData,

        async realtimeInit(dbProps: DatabaseProps<N>): Promise<void>  {
            if (this.isInitialize && this.realtimeChannel) {
                console.warn(`Storage for ${tableName} has been initialized`);
                dbProps.callback(this.toArray());
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
                            const fixed = payload.new;
                            this.currentData.set(fixed.id, fixed);
                            break;
                        }
                        case 'UPDATE': {
                            const fixed = payload.new;
                            this.currentData.set(fixed.id, fixed);
                            break;
                        }
                        case 'DELETE': {
                            const deletedId = payload.old.id;
                            if (deletedId) this.currentData.delete(deletedId);
                            break;
                        }
                    }
                    dbProps.callback(this.toArray());
                }
            );

            let query = supabase.from(tableName).select('*');
            
            const { data, error } = await query;

            if (error) {
                console.error('Initial data fetch error:', error);
                dbProps.callback([]);
                return;
            }

            if (dbProps.additionalQuery) query = dbProps.additionalQuery(query);

            this.currentData.clear();
            data.forEach(dt => {
                const transofrmData = this.transformedData(dt);
                this.currentData.set(transofrmData.id, transofrmData)
            });

            dbProps.callback(this.toArray());
            this.realtimeChannel.subscribe();
            this.isInitialize = true;
        },

        async addToStorage(data: Omit<N, 'id' | 'created_at'>): Promise<string> {
            const { data: inserted, error } = await supabase
            .from(tableName)
            .insert([data])
            .select();

            if (error) throw error.message;
            return inserted[0].id
        },

        async upsertData(upsertNewData: Partial<N>): Promise<any[]> {
            const { data, error } = await supabase
            .from(tableName)
            .upsert([upsertNewData])
            .select();
            
            if (error) throw error.message;
            return data;
        },

        async changeSelectedData(id: string, newData: Partial<Omit<N, 'id' | 'created_at'>>): Promise<void> {
            const { error } = await supabase
            .from(tableName)
            .update(newData)
            .eq('id', id);

            if (error) throw error.message;
        },

        toArray(): N[] {
            return Array.from(this.currentData.values());
        },

        async filterData(param1: string, param2: string) {
            const { error } = await supabase
            .from(tableName)
            .select('*')
            .eq(param1, param2);

            if (error) throw error.message;
        },

        transformedData(item: any): N {
            if (item && typeof item.created_at === 'string') {
                return { ...item, created_at: new Date(item.created_at) } as N;
            }
            return item as N;
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