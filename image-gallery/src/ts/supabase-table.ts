import { supabase } from "./supabase-config";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { DatabaseProps, InsertDataProps, UpdateDataProps } from "./custom-types";

class DatabaseStorage <B extends { id: string }> {
    protected currentData: Map<string, B>;
    private isInitialized: boolean = false;
    private realtimeChannel: RealtimeChannel | null = null;

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
        
        this.realtimeChannel = supabase.channel('any');
        this.realtimeChannel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: db.tableName },
            async (payload: RealtimePostgresChangesPayload<B>) => {
                switch(payload.eventType) {
                    case "INSERT": {
                        const { data, error } = await supabase
                        .from(db.tableName)
                        .select(db.relationalQuery || '*')
                        .eq('id', payload.new.id)
                        .single();

                        if (error) throw error;

                        const transformedData = this.transformsData(data);
                        this.currentData.set(transformedData.id, transformedData);
                        break;
                    }
                    case "UPDATE": {
                        const { data, error } = await supabase
                        .from(db.tableName)
                        .select(db.relationalQuery || '*')
                        .eq('id', payload.new.id)
                        .single();

                        if (error) throw error;

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
        
        try {
            let query = supabase
            .from(db.tableName)
            .select(db.relationalQuery || '*');

            if (db.initialQuery) query = db.initialQuery(query);

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
        } catch (error) {
            db.callback([]);
            throw new Error(`Failed to show data: ${error}`);
        }
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

    protected async upsertData(tableName: string, dataToUpsert: Partial<B>): Promise<B | null> {
        // Supabase `upsert` membutuhkan kolom unik atau PK (Primary Key) untuk mengidentifikasi baris.
        // Di kasus ini, 'id' adalah PK dan akan cocok dengan auth.uid()
        const { data, error } = await supabase
        .from(tableName)
        .upsert([dataToUpsert])
        .select()
        .single();

        if (error) throw `Failed to upsert data: ${error}`;
        return data;
    }

    protected async selectedData(tableName: string, id: string): Promise<B> { 
        const { data, error } = await supabase
        .from(tableName)
        .select("*") 
        .eq('id', id);

        if (error) throw `Failed to show selected data: ${error}`;

        const item = data[0];
        return item;
    }

    protected async changeSelectedData(props: UpdateDataProps<B>): Promise<void> {
        const { error } = await supabase
        .from(props.tableName)
        .update(props.newData)
        .eq('id', props.id);

        if (error) throw error;
    }

    protected async deleteData(tableName: string, id: string): Promise<void>;
    protected async deleteData(tableName: string, id?: string): Promise<void>;
    
    protected async deleteData(tableName: string, id?: string): Promise<void> {
        if (id !== undefined) {          
            const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id);

            if (error) throw error;
        } else {
            const { error } = await supabase
            .from(tableName)
            .delete()
            .not('id', 'is', null);

            if (error) throw error;
        }    
    }

    teardownStorage(): void {
        this.currentData.clear();
        this.isInitialized = false;
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