import { supabase } from "./supabase-config";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface DatabaseProps<B> {
    callback: (data: B[]) => void;
    initialQuery?: (query: any) => any;
}

class DatabaseStorage <B extends { id: string }> {
    protected currentData: Map<string, B>;
    private table_name: string;
    private isInitialized: boolean = false;
    private realtimeChannel: RealtimeChannel | null = null;

    constructor(table_name: string) {
        this.table_name = table_name
        this.currentData = new Map<string, B>();
    }

    protected async realtimeInit(db: DatabaseProps<B>): Promise<void> {
        if (this.isInitialized && this.realtimeChannel) {
            console.warn(`Realtime channel for ${this.table_name} is already initialized.`);
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
            { event: '*', schema: 'public', table: this.table_name },
            (payload: RealtimePostgresChangesPayload<B>) => {
                switch(payload.eventType) {
                    case "INSERT": {
                        this.currentData.set(payload.new.id, payload.new);
                        break;
                    }
                    case "UPDATE": {
                        this.currentData.set(payload.new.id, payload.new);
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
            .from(this.table_name)
            .select('*');

            if (db.initialQuery) query = db.initialQuery(query);

            const { data, error } = await query;

            if (error) {
                db.callback([]);
                throw new Error(`Error fetching data: ${error.message}`);
            }

            this.currentData.clear();
            data.forEach(dt => this.currentData.set(dt.id, dt));

            db.callback(this.toArray());
            this.realtimeChannel.subscribe();
            this.isInitialized = true;
        } catch (error) {
            db.callback([]);
            throw new Error(`Failed to show data: ${error}`);
        }
    }

    protected async insertData(newData: Omit<B, 'id' | 'created_at'>): Promise<string> {
        const { data, error } = await supabase
        .from(this.table_name)
        .insert([newData])
        .select();

        if (error) throw error;
        return data[0].id;
    }

    protected async selectedData(id: string): Promise<B> { 
        const { data, error } = await supabase
        .from(this.table_name)
        .select("*") 
        .eq('id', id);

        if (error) throw new Error(`Failed to show selected data: ${error}`);

        const item = data[0];
        return item;
    }

    protected async changeSelectedData(id: string, newData: Partial<Omit<B, 'id' | 'created_at'>>): Promise<void> {
        const { error } = await supabase
        .from(this.table_name)
        .update(newData)
        .eq('id', id);

        if (error) throw error;
    }

    protected async deleteData(id: string): Promise<void>;
    protected async deleteData(id?: string): Promise<void>;
    
    protected async deleteData(id?: string): Promise<void> {
        if (id !== undefined) {          
            const { error } = await supabase
            .from(this.table_name)
            .delete()
            .eq('id', id);

            if (error) throw error;
        } else {
            const { error } = await supabase
            .from(this.table_name)
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