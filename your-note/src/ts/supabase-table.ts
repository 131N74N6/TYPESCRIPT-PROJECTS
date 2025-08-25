import { supabase } from "./supabase-config";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { DatabaseProps, DeleteDataProps, InsertDataProps, UpdateDataProps, UpsertDataProps } from "./custom-types";

class SupabaseTable <Z extends { id: string }> {
    currentData: Map<string, Z>;
    private realtimeChannel: RealtimeChannel | null = null;
    private additionalQueryFn: ((query: any) => any) | null = null;
    private relationalQuery: string | null = null;

    constructor() {
        this.currentData = new Map<string, Z>();
    }

    async realtimeInit(props: DatabaseProps<Z>): Promise<void> {
        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }

        this.additionalQueryFn = props.initialQuery || null;
        this.relationalQuery = props.relationalQuery || null;
        
        this.realtimeChannel = supabase.channel(`db_${props.tableName}`);
        this.realtimeChannel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: props.tableName },
            async (payload: RealtimePostgresChangesPayload<Z>) => {
                switch(payload.eventType) {
                    case "INSERT": {
                        let query = supabase
                        .from(props.tableName)
                        .select(this.relationalQuery || '*')
                        .eq('id', payload.new.id)
                        .single();

                        if (this.additionalQueryFn) query = this.additionalQueryFn(query);

                        const { data, error } = await query;

                        if (error) throw error.message;

                        const transformedData = this.transformsData(data);
                        this.currentData.set(transformedData.id, transformedData);
                        break;
                    }
                    case "UPDATE": {
                        let query = supabase
                        .from(props.tableName)
                        .select(this.relationalQuery || '*')
                        .eq('id', payload.new.id)
                        .single();

                        if (this.additionalQueryFn) query = this.additionalQueryFn(query);

                        const { data, error } = await query;

                        if (error) throw error.message;

                        const transformedChangeData = this.transformsData(data);
                        this.currentData.set(transformedChangeData.id, transformedChangeData);
                        break;
                    }
                    case "DELETE": {
                        const deletedId = payload.old.id;
                        if (deletedId) this.currentData.delete(deletedId);
                        break;
                    }
                }
                props.callback(this.toArray());
            }
        );
        
        let query = supabase.from(props.tableName).select(this.relationalQuery || '*');

        if (this.additionalQueryFn) query = this.additionalQueryFn(query);

        const { data, error } = await query;

        if (error) {
            props.callback([]);
            throw new Error(`Error fetching data: ${error.message}`);
        }

        this.currentData.clear();
        data.forEach(dt => {
            const transformData = this.transformsData(dt);
            this.currentData.set(transformData.id, transformData)
        });

        props.callback(this.toArray());
        this.realtimeChannel.subscribe();
    }

    private transformsData(data: any): Z {
        if (data && data.created_at && typeof data.created_at === 'string') {
            return { ...data, created_at: new Date(data.created_at) } as Z;
        }
        return data as Z;
    }

    async insertData(props: InsertDataProps<Z>): Promise<string> {
        const { data, error } = await supabase
        .from(props.tableName)
        .insert([props.newData])
        .select();

        if (error) throw 'Failed to insert data';
        return data[0].id;
    }

    protected async upsertData(props: UpsertDataProps<Z>): Promise<Z | null> {
        const { data, error } = await supabase
        .from(props.tableName)
        .upsert([props.dataToUpsert])
        .select()
        .single();

        if (error) throw 'Failed to upsert data';
        return data;
    }

    protected async updateData(props: UpdateDataProps<Z>): Promise<void> {
        const { error } = await supabase
        .from(props.tableName)
        .update(props.newData)
        .eq(props.column, props.values);

        if (error) throw 'Failed to change data';
    }
    
    async deleteData(props: DeleteDataProps): Promise<void> {
        if (props.column !== undefined) {          
            if (Array.isArray(props.values)) {
                const { error } = await supabase
                .from(props.tableName)
                .delete()
                .in(props.column, props.values);

                if (error) 'Failed to change data';
            } else if (typeof props.values === 'string') {
                const { error } = await supabase
                .from(props.tableName)
                .delete()
                .eq(props.column, props.values);

                if (error) 'Failed to change data';
            } else {
                const { error } = await supabase
                .from(props.tableName)
                .delete()
                .not(props.column, 'is', null);
    
                if (error) 'Failed to change data';
            }    
        }
    }

    teardownTable(): void {
        this.currentData.clear();
        this.additionalQueryFn = null;
        this.relationalQuery = null;
        
        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }
    }

    toArray(): Z[] {
        return Array.from(this.currentData.values());
    }
}

export default SupabaseTable;