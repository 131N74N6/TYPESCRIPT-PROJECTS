export type Product = {
    id: string;
    created_at: Date;
    name: string;
    price: number;
    image_name: string;
    image_url: string;
}

export type CartItem = Product & {
    quantity: number;
}