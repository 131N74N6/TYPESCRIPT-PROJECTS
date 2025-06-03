import supabase from "./supabase-config";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

class DatabaseStorage <LV extends { id: string }> {
    protected currentData: Map<string, LV>;
    private tabble_name: string;

    constructor(tabble_name: string) {
        this.tabble_name = tabble_name
        this.currentData = new Map<string, LV>()
    }
    protected realtimeInit(callback: (data: LV[]) => void): RealtimeChannel {
        const channel = supabase.channel('any');
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: this.tabble_name },
            (payload: RealtimePostgresChangesPayload<LV>) => {
                const processData = (dt: any): LV => ({ 
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
            .from(this.tabble_name)
            .select('*');

            if (error) {
                callback([]);
                throw new Error(`Error fetching data: ${error}`);
            }

            this.currentData.clear();
            data.forEach(dt => {
                const processed = { ...dt, created_at: new Date(dt.created_at) } as LV;
                this.currentData.set(processed.id, processed);
            });

            callback(Array.from(this.currentData.values()));
            channel.subscribe();
        })();

        return channel
    }

    protected async addToDatabase(newData: Omit<LV, 'id'>): Promise<string> {
        const { data, error } = await supabase
        .from(this.tabble_name)
        .insert([newData])
        .select();

        if (error) throw error;
        return data[0].id;
    }

    protected async changeSelectedData(id: string, newData: Partial<Omit<LV, 'id'>>): Promise<void> {
        const { error } = await supabase
        .from(this.tabble_name)
        .update(newData)
        .eq('id', id);

        if (error) throw error;
    }

    protected async deleteSelectedData(id: string): Promise<void> {
        const { error } = await supabase
        .from(this.tabble_name)
        .delete()
        .eq('id', id);

        if (error) throw error;
    }

    protected async deleteAllData(): Promise<void> {
        const { error } = await supabase
        .from(this.tabble_name)
        .delete()
        .not('id', 'is', null);

        if (error) throw error;
    }

    teardownStorage(): void {
        this.currentData.clear();
    }
}

export default DatabaseStorage;