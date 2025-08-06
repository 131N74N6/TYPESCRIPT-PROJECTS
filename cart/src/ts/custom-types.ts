export type Product = {
    id: string;
    created_at: Date;
    name: string;
    price: number;
    image_name: string;
    image_url: string;
    user_id: string;
}

export type CartItem = Product & {
    quantity: number;
}

export type Users = {
    id: string;
    email: string;
    password: string;
    username: string;
}