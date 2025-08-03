import { supabase } from "./supabase-config";
import { RealtimeChannel, type RealtimePostgresChangesPayload } from "@supabase/supabase-js";

function TableStorage<TT extends { id: string }>(tableName: string) {
    return {
        currentData: new Map<string, TT>() as Map<string, TT>,
        realtimeChannel: null as RealtimeChannel | null,
        isInitialize: false as boolean,

        async realtimeInit(callback: (data: TT[]) => void): Promise<void> {
            if (this.isInitialize && this.realtimeChannel) {
                console.warn(`TableStorage for ${tableName} is already initialized.`);
                callback(this.toArray());
                return;
            }

            if (this.realtimeChannel) {
                this.realtimeChannel.unsubscribe;
                this.realtimeChannel = null;
            }

            this.realtimeChannel = supabase.channel('any');
            this.realtimeChannel.on(
                'postgres_changes',
                { event: '*', schema: 'public', table: tableName },
                (payload: RealtimePostgresChangesPayload<TT>) => {

                    switch (payload.eventType) {
                        case 'INSERT': {
                            const newItem = this.transformedData(payload.new);
                            this.currentData.set(newItem.id, newItem);
                            break;
                        }
                        case 'UPDATE': {
                            const updatedItem = this.transformedData(payload.new);
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
                callback([]);
                throw error;
            }
            
            this.currentData.clear();
            data.forEach(dt => {
                const transformData = this.transformedData(dt);
                this.currentData.set(transformData.id, transformData);
            });

            callback(this.toArray());
            this.realtimeChannel.subscribe();
            this.isInitialize = true;
        },

        transformedData(item: any): TT {
            if (item && item.created_at && typeof item.created_at === 'string') {
                return { ...item, created_at: new Date(item.created_at) } as TT;
            } 
            return item as TT;
        },

        async insertData(newData: Omit<TT, 'id' | 'created_at'>): Promise<string> {
            const { data: inserted, error } = await supabase
            .from(tableName)
            .insert([newData])
            .select();

            if (error) throw error
            return inserted[0].id;
        },

        async upsertData(upsertedData: Partial<TT>): Promise<TT | null> {
            const { data, error } = await supabase
            .from(tableName)
            .upsert([upsertedData])
            .select()
            .single();

            if (error) throw `Failed to upsert data: ${error}`;
            return data;
        },

        async changeSelectedData(id: string, newData: Partial<Omit<TT, 'id'>>): Promise<void> {
            const { error } = await supabase
            .from(tableName)
            .update(newData)
            .eq('id', id);

            if (error) throw error
        },

        async deleteSelectedData(id: string): Promise<void> {
            const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id);

            if (error) throw error
        },

        async deleteAllData(): Promise<void> {
            const { error } = await supabase
            .from(tableName)
            .delete()
            .not('id', 'is', null);

            if (error) throw error
        },

        teardownStorage(): void {
            this.currentData.clear();
            this.isInitialize = false;
            if (this.realtimeChannel) {
                this.realtimeChannel.unsubscribe();
                this.realtimeChannel = null;
            }
        },

        toArray(): TT[] {
            return Array.from(this.currentData.values());
        }
    }
}

export default TableStorage;