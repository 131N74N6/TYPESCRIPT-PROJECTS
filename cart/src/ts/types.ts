export type Product = {
    id: string;
    name: string;
    price: number;
    images: string;
}

export type CartItem = Product & {
    quantity: number;
}