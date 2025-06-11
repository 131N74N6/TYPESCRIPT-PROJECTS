import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import supabase from "./supabase-config";

interface BaseModel {
    id: string;
    created_at: Date;
}

interface ListNode<T> {
    data: T;
    next: ListNode<T> | null;
    prev: ListNode<T> | null; // Untuk implementasi doubly linked list
}

class TableStorage <XDD extends BaseModel> {
    protected currenData: Map<string, ListNode<XDD>> = new Map<string, ListNode<XDD>>();
    private isInitialized: boolean = false;
    private realtimeChannel: RealtimeChannel | null = null;
    private tableName: string;
    private head : ListNode<XDD> | null = null;
    private tail : ListNode<XDD> | null = null;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    private addDataToNode(data: XDD): void {
        const newNode: ListNode<XDD> = {
            data,
            next: null,
            prev: this.tail
        }

        this.tail ? this.tail.next = newNode : this.head = newNode; // Jika ini adalah node pertama

        this.tail = newNode;
        this.currenData.set(data.id, newNode);
    }

    private changeNodeData(data: XDD): void {
        const node = this.currenData.get(data.id)
        if (node) node.data = data;
    }

    private removeDataFromNode(id: string): void {
        const node = this.currenData.get(id);
        if (!node) return;
        node.prev ? node.prev.next = node.next : this.head = node.next;
        node.next ? node.next.prev = node.prev : this.tail = node.prev;
        this.currenData.delete(id);
    }

    private linkedListToArray(): XDD[] {
        const array: XDD[] = [];
        let current = this.head;
        while (current) {
            array.push(current.data);
            current = current.next;
        }
        return array;
    }

    private resetLinkedList(): void {
        this.currenData.clear();
        this.head = null;
        this.tail = null;
    }

    protected async realtimeInit(
        callback: (data: XDD[]) => void, initialQuery?: (query: any) => any
    ): Promise<void> {
        if (this.isInitialized && this.realtimeChannel) {
            console.warn(`TableStorage for ${this.tableName} is already initialized.`);
            return;
        }

        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }

        this.realtimeChannel = supabase.channel(`channel-${this.tableName}`);
        this.realtimeChannel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: this.tableName },
            (payload: RealtimePostgresChangesPayload<XDD>) => {
                switch(payload.eventType) {
                    case "INSERT": {
                        const newData = this.processData(payload.new);
                        this.addDataToNode(newData);
                        break;
                    }
                    case "UPDATE": {
                        const changeData = this.processData(payload.new);
                        this.changeNodeData(changeData);
                        break;
                    }
                    case "DELETE":{
                        const data = payload.old.id;
                        if (data) this.removeDataFromNode(data)
                        break;
                    }
                }
                callback(this.linkedListToArray());
            }
        );

        try {
            let query = supabase
            .from(this.tableName)
            .select('*');

            const { data, error } = await query;

            if (initialQuery) query = initialQuery(query);

            if (error) throw error;

            this.currenData.clear();
            data.forEach(dt => {
                const process = { ...dt, created_at: new Date(dt.created_at) } as XDD;
                this.addDataToNode(process);
            });
            
            callback(this.linkedListToArray());
            this.realtimeChannel.subscribe();
            this.isInitialized = true;
        } catch (error) {
            this.realtimeChannel = null;
            this.isInitialized = false;
            callback([]);
            throw new Error(`Something went wrong ${error}`);
        }
    }

    private processData(data: any): XDD {
        if (data && data.created_at && typeof data.created_at === 'string') {
            return { ...data, created_at: new Date(data.created_at) } as XDD;
        }
        return data as XDD;
    }

    protected async insertToDatabase(newData: Omit<XDD, 'id'>): Promise<XDD> {
        const { error, data } = await supabase
        .from(this.tableName)
        .insert([newData])
        .select()
        .single();
        if (error) throw error;

        return data[0].id;
    }

    protected async changeSelectedData(id: string, newData: Partial<Omit<XDD, 'id'>>): Promise<void> {
        const { error } = await supabase
        .from(this.tableName)
        .update(newData)
        .eq('id', id)
        .select()
        .single();

        if (error) throw error;
    }

    protected async deleteSelectedData(id: string): Promise<void> {
        const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

        if (error) throw error;
    }

    protected async removeAllData(): Promise<void> {
        const { error } = await supabase
        .from(this.tableName)
        .delete()
        .not('id', 'is', null);

        if (error) throw error;
    }

    protected teardownTable(): void {
        this.resetLinkedList();
        this.isInitialized = false;
        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }
    }
}

export default TableStorage;