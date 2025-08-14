import { supabase } from "./supabase-config";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { DatabaseProps, DeleteDataProps, InsertDataProps, UpdateDataProps, UpsertDataProps } from "./custom-types";

class DatabaseStorage <B extends { id: string }> {
    protected currentData: Map<string, B>;
    private isInitialized: boolean = false;
    private realtimeChannel: RealtimeChannel | null = null;
    private additionalQueryFn: ((query: any) => any) | null = null;
    private relationalQuery: string | null = null;

    constructor() {
        this.currentData = new Map<string, B>();
    }

    protected async realtimeInit(db: DatabaseProps<B>): Promise<void> {
        if (this.isInitialized && this.realtimeChannel) {
            console.warn(`Realtime channel for ${db.tableName} is already initialized.`);
            db.callback(this.toArray());
            return;
        }

        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }

        this.additionalQueryFn = db.initialQuery || null;
        this.relationalQuery = db.relationalQuery || null;
        
        this.realtimeChannel = supabase.channel('any');
        this.realtimeChannel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: db.tableName },
            async (payload: RealtimePostgresChangesPayload<B>) => {
                switch(payload.eventType) {
                    case "INSERT": {
                        let query = supabase
                        .from(db.tableName)
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
                        .from(db.tableName)
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
                db.callback(this.toArray());
            }
        );
        
        let query = supabase.from(db.tableName).select(this.relationalQuery || '*');

        if (this.additionalQueryFn) query = this.additionalQueryFn(query);

        const { data, error } = await query;

        if (error) {
            db.callback([]);
            throw new Error(`Error fetching data: ${error.message}`);
        }

        this.currentData.clear();
        data.forEach(dt => {
            const transformData = this.transformsData(dt);
            this.currentData.set(transformData.id, transformData)
        });

        db.callback(this.toArray());
        this.realtimeChannel.subscribe();
        this.isInitialized = true;
    }

    private transformsData(data: any): B {
        if (data && data.created_at && typeof data.created_at === 'string') {
            return { ...data, created_at: new Date(data.created_at) } as B;
        }
        return data as B;
    }

    protected async insertData(props: InsertDataProps<B>): Promise<string> {
        const { data, error } = await supabase
        .from(props.tableName)
        .insert([props.newData])
        .select();

        if (error) throw `Failed to insert data: ${error}`;
        return data[0].id;
    }

    protected async upsertData(props: UpsertDataProps<B>): Promise<B | null> {
        // Supabase `upsert` membutuhkan kolom unik atau PK (Primary Key) untuk mengidentifikasi baris.
        // Di kasus ini, 'id' adalah PK dan akan cocok dengan auth.uid()
        const { data, error } = await supabase
        .from(props.tableName)
        .upsert([props.dataToUpsert])
        .select()
        .single();

        if (error) throw `Failed to upsert data: ${error}`;
        return data;
    }

    protected async changeSelectedData(props: UpdateDataProps<B>): Promise<void> {
        const { error } = await supabase
        .from(props.tableName)
        .update(props.newData)
        .eq('id', props.id);

        if (error) throw error.message;
    }
    
    protected async deleteData(props: DeleteDataProps): Promise<void> {
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

    teardownStorage(): void {
        this.currentData.clear();
        this.isInitialized = false;
        this.additionalQueryFn = null;
        this.relationalQuery = null;
        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }
    }

    protected toArray(): B[] {
        return Array.from(this.currentData.values());
    }
}

export default DatabaseStorage;