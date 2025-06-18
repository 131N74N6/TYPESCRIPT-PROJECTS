import supabase from "./supabase-config";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

class DatabaseStorage <QWERTY extends { id: string }> {
    protected currentData: Map<string, QWERTY>;
    protected tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
        this.currentData = new Map<string, QWERTY>();
    }

    protected realtimeInit(callback: (data: QWERTY[]) => void): RealtimeChannel {
        const channel = supabase.channel('any');
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: this.tableName },
            (payload: RealtimePostgresChangesPayload<QWERTY>) => {
                const processData = (dt: any): QWERTY => ({ 
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
            const { data, error } = await supabase
            .from(this.tableName)
            .select('*');

            if (error) {
                callback([]);
                throw new Error(`Error fetching data: ${error}`);
            }

            this.currentData.clear();
            data.forEach(dt => {
                const processed = { ...dt, created_at: new Date(dt.created_at) } as QWERTY;
                this.currentData.set(processed.id, processed);
            });

            callback(Array.from(this.currentData.values()));
            channel.subscribe();
        })();

        return channel
    }

    protected async addToDatabase(newData: Omit<QWERTY, 'id'>): Promise<string> {
        const { data, error } = await supabase
        .from(this.tableName)
        .insert([newData])
        .select();

        if (error) throw error;
        return data[0].id;
    }

    protected async changeSelectedData(id: string, newData: Partial<Omit<QWERTY, 'id'>>): Promise<void> {
        const { error } = await supabase
        .from(this.tableName)
        .update(newData)
        .eq('id', id);

        if (error) throw error;
    }

    protected async deleteSelectedData(id: string): Promise<void> {
        const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

        if (error) throw error;
    }

    protected async deleteAllData(): Promise<void> {
        const { error } = await supabase
        .from(this.tableName)
        .delete()
        .not('id', 'is', null);

        if (error) throw error;
    }

    teardownStorage(): void {
        this.currentData.clear();
    }
}

export default DatabaseStorage;