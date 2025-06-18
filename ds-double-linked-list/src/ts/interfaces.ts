export interface BaseModel {
    id: string;
    created_at: Date;
}

export interface ListNode<T> {
    data: T;
    next: ListNode<T> | null;
    prev: ListNode<T> | null; // Untuk implementasi doubly linked list
}