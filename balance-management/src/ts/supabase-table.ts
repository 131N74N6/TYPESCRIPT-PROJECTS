import { supabase } from "./supabase-config";
import { RealtimeChannel, type RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { DatabaseProps, DeleteDataProps, InsertDataProps, UpdateDataProps, UpsertDataProps } from "./custom-types";

function TableStorage<TT extends { id: string }>() {
    return {
        currentData: new Map<string, TT>() as Map<string, TT>,
        realtimeChannel: null as RealtimeChannel | null,
        isInitialize: false as boolean,
        additionalQueryFn: null as ((query: any) => any) | null,
        relationalQuery: null as string | null,

        async realtimeInit(dbProps: DatabaseProps<TT>): Promise<void> {
            if (this.isInitialize && this.realtimeChannel) {
                console.warn(`TableStorage for ${dbProps.tableName} is already initialized.`);
                dbProps.callback(this.toArray());
                return;
            }

            if (this.realtimeChannel) {
                this.realtimeChannel.unsubscribe();
                this.realtimeChannel = null;
            }

            this.additionalQueryFn = dbProps.initialQuery || null;
            this.relationalQuery = dbProps.relationalQuery || null;

            this.realtimeChannel = supabase.channel('any');
            this.realtimeChannel.on(
                'postgres_changes',
                { event: '*', schema: 'public', table: dbProps.tableName },
                async (payload: RealtimePostgresChangesPayload<TT>) => {
                    switch (payload.eventType) {
                        case 'INSERT': {
                            let mainQuery = supabase
                            .from(dbProps.tableName)
                            .select(dbProps.relationalQuery || '*')
                            .eq('id', payload.new.id)
                            .single();

                            if (this.additionalQueryFn) mainQuery = this.additionalQueryFn(mainQuery);

                            const { data, error } = await mainQuery;

                            if (error) throw error.message;

                            const newItem = this.transformedData(data);
                            this.currentData.set(newItem.id, newItem);
                            break;
                        }
                        case 'UPDATE': {
                            let mainQuery = supabase
                            .from(dbProps.tableName)
                            .select(dbProps.relationalQuery || '*')
                            .eq('id', payload.new.id)
                            .single();

                            if (this.additionalQueryFn) mainQuery = this.additionalQueryFn(mainQuery);

                            const { data, error } = await mainQuery;

                            if (error) throw error.message;

                            const newItem = this.transformedData(data);
                            this.currentData.set(newItem.id, newItem);
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

            let query = supabase.from(dbProps.tableName).select(dbProps.relationalQuery || '*');

            if (this.additionalQueryFn) query = this.additionalQueryFn(query);
            
            const { data, error } = await query;

            if (error) {
                dbProps.callback([]);
                throw error.message;
            }
            
            this.currentData.clear();
            data.forEach(dt => {
                const transformData = this.transformedData(dt);
                this.currentData.set(transformData.id, transformData);
            });

            dbProps.callback(this.toArray());
            this.realtimeChannel.subscribe();
            this.isInitialize = true;
        },

        transformedData(item: any): TT {
            if (item && item.created_at && typeof item.created_at === 'string') {
                return { ...item, created_at: new Date(item.created_at) } as TT;
            } 
            return item as TT;
        },

        async insertData(props: InsertDataProps<TT>): Promise<string> {
            const { data: inserted, error } = await supabase
            .from(props.tableName)
            .insert([props.newData])
            .select();

            if (error) throw error
            return inserted[0].id;
        },

        async upsertData(props: UpsertDataProps<TT>): Promise<TT | null> {
            const { data, error } = await supabase
            .from(props.tableName)
            .upsert([props.upsertedData])
            .select()
            .single();

            if (error) throw `Failed to upsert data: ${error}`;
            return data;
        },

        async changeSelectedData(props: UpdateDataProps<TT>): Promise<void> {
            const { error } = await supabase
            .from(props.tableName)
            .update(props.newData)
            .eq('id', props.values);

            if (error) throw error
        },

        async deleteData(props: DeleteDataProps): Promise<void> {
            if (props.column !== undefined) {
                if (Array.isArray(props.values)) {                    
                    const { error } = await supabase
                    .from(props.tableName)
                    .delete()
                    .in(props.column, props.values);

                    if (error) throw error.message;
                } else if (typeof props.values === 'string') {                    
                    const { error } = await supabase
                    .from(props.tableName)
                    .delete()
                    .eq(props.column, props.values);

                    if (error) throw error.message;
                } else {                    
                    const { error } = await supabase
                    .from(props.tableName)
                    .delete()
                    .not(props.column, 'is', null);

                    if (error) throw error.message
                }
            }
        },

        teardownStorage(): void {
            this.currentData.clear();
            this.isInitialize = false;
            this.additionalQueryFn = null;
            this.relationalQuery = null;
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