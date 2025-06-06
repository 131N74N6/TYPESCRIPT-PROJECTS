import supabase from "./supabase-config";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

class DatabaseStorage <MBK extends { id: string }> {
    protected currentData: Map<string, MBK>;
    private table_name: string;

    constructor(table_name: string) {
        this.table_name = table_name
        this.currentData = new Map<string, MBK>();
    }

    protected realtimeInit(
        callback: (data: MBK[]) => void, initialQuery?: (query: any) => any): RealtimeChannel {
        const channel = supabase.channel('any');
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: this.table_name },
            (payload: RealtimePostgresChangesPayload<MBK>) => {
                const processData = (dt: any): MBK => ({ 
                    ...dt, created_at: new Date(dt.created_at) 
                });

                switch(payload.eventType) {
                    case "INSERT": {
                        const newData = processData(payload.new);
                        this.currentData.set(newData.id, newData);
                        break;
                    }
                    case "UPDATE": {
                        const changeData = processData(payload.new);
                        this.currentData.set(changeData.id, changeData);
                        break;
                    }
                    case "DELETE": {
                        const deletedId = payload.old.id;
                        if (deletedId) {
                            this.currentData.delete(deletedId);
                        }
                        break;
                    }
                }
                callback(Array.from(this.currentData.values()));
            }
        );
        (async () => {
            try {
                let query = supabase
                .from(this.table_name)
                .select('*');

                if (initialQuery) {
                    query = initialQuery(query);
                }

                const { data, error } = await query;

                if (error) {
                    callback([]);
                    throw new Error(`Error fetching data: ${error.message}`);
                }

                this.currentData.clear();
                data.forEach(dt => {
                    const processed = { ...dt, created_at: new Date(dt.created_at) } as MBK;
                    this.currentData.set(processed.id, processed);
                });

                callback(Array.from(this.currentData.values()));
                channel.subscribe();
            } catch (error) {
                callback([]);
                throw new Error(`Failed to show data: ${error}`);
            }
        })();

        return channel;
    }

    protected async addToDatabase(newData: Omit<MBK, 'id'>): Promise<string> {
        const { data, error } = await supabase
        .from(this.table_name)
        .insert([newData])
        .select();

        if (error) throw error;
        return data[0].id;
    }

    protected async selectedData(id: string): Promise<MBK> { 
        const { data, error } = await supabase
        .from(this.table_name)
        .select("*") 
        .eq('id', id);

        if (error) throw new Error(`Failed to show selected data: ${error}`);

        const item = data[0];
        return { ...item, created_at: new Date(item.created_at) } as MBK;
    }

    protected async changeSelectedData(id: string, newData: Partial<Omit<MBK, 'id'>>): Promise<void> {
        const { error } = await supabase
        .from(this.table_name)
        .update(newData)
        .eq('id', id);

        if (error) throw error;
    }

    protected async deleteSelectedData(id: string): Promise<void> {
        const { error } = await supabase
        .from(this.table_name)
        .delete()
        .eq('id', id);

        if (error) throw error;
    }

    protected async deleteAllData(): Promise<void> {
        const { error } = await supabase
        .from(this.table_name)
        .delete()
        .not('id', 'is', null);

        if (error) throw error;
    }

    teardownStorage(): void {
        this.currentData.clear();
    }
}

export default DatabaseStorage;