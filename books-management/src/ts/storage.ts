import supabase from "./supabase-config";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

class DatabaseStorage <QWERTY extends { id: string }> {
    protected currentData: QWERTY[] = [];
    protected tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
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
                        this.currentData.push(newData);
                        break;
                    }
                    case "UPDATE": {
                        const changeData = processData(payload.new);
                        const index = this.currentData.findIndex(dt => dt.id === changeData.id);
                        if (index !== -1) this.currentData[index] = changeData;
                        break;
                    }
                    case "DELETE": {
                        const selectedData = payload.old.id;
                        this.currentData = this.currentData.filter(dt => dt.id === selectedData);
                        break;
                    }
                }
                callback([...this.currentData]);
            }
        );
        (async () => {
            const { data, error } = await supabase
            .from(this.tableName)
            .select('*');

            if (error) throw error;

            this.currentData = data.map(dt => ({ 
                ...dt, created_at: new Date(dt.created_at) 
            })) as QWERTY[];

            callback(this.currentData);
        })();

        return channel
    }

    protected async addToDatabase(newData: Omit<QWERTY, 'id'>): Promise<string> {
        const { data, error } = await supabase
        .from(this.tableName)
        .insert(newData)
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
        this.currentData = [];
    }
}

export default DatabaseStorage;