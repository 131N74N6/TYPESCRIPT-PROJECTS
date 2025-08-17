import { supabase } from './supabase-config';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { DatabaseProps, DeleteProps, InsertDataProps, UpdateSelectedDataProps } from './custom-types';

const TableStorage = <N extends { id: string }>() => {
    const currentData: Map<string, N> = new Map<string, N>();
    let isInitialize: boolean = false;
    let realtimeChannel: RealtimeChannel | null = null;
    let additionalQueryFn: ((query: any) => any) | null = null;
    let relationalQuery: string | null = null;

    async function realtimeInit(dbProps: DatabaseProps<N>): Promise<void>  {
        if (isInitialize && realtimeChannel) {
            console.warn(`Storage for ${dbProps.tableName} has been initialized`);
            dbProps.callback(toArray());
            return;
        }

        if (realtimeChannel) {
            realtimeChannel.unsubscribe();
            realtimeChannel = null;
        }

        additionalQueryFn = dbProps.additionalQuery || null;
        relationalQuery = dbProps.relationalQuery || null;
        
        realtimeChannel = supabase.channel('any');
        realtimeChannel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: dbProps.tableName },
            async (payload: RealtimePostgresChangesPayload<N>) => {
                switch (payload.eventType) {
                    case 'INSERT': {
                        let mainQuery = supabase
                        .from(dbProps.tableName)
                        .select(relationalQuery || '*')
                        .eq('id', payload.new.id)
                        .single();

                        if (additionalQueryFn) mainQuery = additionalQueryFn(mainQuery);
                        
                        const { data, error } = await mainQuery;
                        
                        if (error) throw `Realtime INSERT error ${error.message}`;
                        
                        const fixed = transformedData(data);
                        currentData.set(fixed.id, fixed);
                        break;
                    }
                    case 'UPDATE': {
                        const id = payload.new.id;
                        if (currentData.has(id)) {
                            const getOldData = currentData.get(id);
                            const updatedData = { ...getOldData, ...payload.new };
                            currentData.set(id, transformedData(updatedData));
                        }
                        break;
                    }
                    case 'DELETE': {
                        const deletedId = payload.old.id;
                        if (deletedId) currentData.delete(deletedId);
                        break;
                    }
                }
                dbProps.callback(toArray());
            }
        );

        let query = supabase.from(dbProps.tableName).select(relationalQuery || '*');
        
        if (additionalQueryFn) query = additionalQueryFn(query);

        const { data, error } = await query;

        if (error) {
            dbProps.callback([]);
            throw `Initial data fetch error: ${error.message}`;
        }

        currentData.clear();
        data.forEach(dt => {
            const transformData = transformedData(dt);
            currentData.set(transformData.id, transformData);
        });

        dbProps.callback(toArray());
        realtimeChannel.subscribe();
        isInitialize = true;
    }

    async function addToStorage(props: InsertDataProps<N>): Promise<string> {
        const { data: inserted, error } = await supabase
        .from(props.tableName)
        .insert([props.data])
        .select();

        if (error) throw error.message;
        return inserted[0].id;
    }

    async function upsertData(tableName: string, upsertNewData: Partial<N>): Promise<any[]> {
        const { data, error } = await supabase
        .from(tableName)
        .upsert([upsertNewData])
        .select()
        .single();
        
        if (error) throw error.message;
        return data;
    }

    async function changeSelectedData(props: UpdateSelectedDataProps<N>): Promise<void> {
        const { error } = await supabase
        .from(props.tableName)
        .update(props.newData)
        .eq(props.column, props.value);

        if (error) throw error.message;
    }

    function toArray(): N[] {
        return Array.from(currentData.values());
    }

    async function filterData(tableName: string, param1: string, param2: string) {
        const { error } = await supabase
        .from(tableName)
        .select('*')
        .eq(param1, param2);

        if (error) throw error.message;
    }

    function transformedData(item: any): N {
        if (item && typeof item.created_at === 'string') {
            return { ...item, created_at: new Date(item.created_at) } as N;
        }
        return item as N;
    }

    function teardownStorage(): void {
        currentData.clear();
        isInitialize = false;
        additionalQueryFn = null;
        relationalQuery = null;
        if (realtimeChannel) {
            realtimeChannel.unsubscribe();
            realtimeChannel = null;
        }
    }

    async function deleteData(props: DeleteProps): Promise<void> {
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

                if (error) throw error.message;
            }
        }
    }

    return {
        addToStorage, changeSelectedData, currentData, deleteData, 
        filterData, realtimeInit, teardownStorage, toArray, upsertData
    }
}

export default TableStorage;