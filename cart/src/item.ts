type Product = {
    id: number;
    name: string;
    price: number;
    images: string;
}

const productData: Product[] = [
    {
        id: 1, 
        name: "Mouse", 
        price: 450000, 
        images: "https://m.media-amazon.com/images/I/61pDShoLXqL._AC_SL1000_.jpg"
    },
    {
        id: 2, 
        name: "Ssd Nvme gen 4 2tb", 
        price: 2200000, 
        images: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6509/6509710_sd.jpg"
    },
    {
        id: 3, 
        name: "Ssd Nvme gen 4 1tb", 
        price: 1000000, 
        images: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6509/6509710_sd.jpg"
    },
    {
        id: 4, 
        name: "Ssd Nvme gen 4 4tb", 
        price: 4000000, 
        images: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6509/6509710_sd.jpg"
    },
    {
        id: 5,
        name: "Hdd 2.5 1tb",
        price: 800000,
        images: "https://th.bing.com/th/id/OIP.bTZRScV5retfFEnXDVIf6AHaHa?rs=1&pid=ImgDetMain"
    },
    {
        id: 6,
        name: "Hdd 2.5 500gb",
        price: 350000,
        images: "https://th.bing.com/th/id/OIP.bTZRScV5retfFEnXDVIf6AHaHa?rs=1&pid=ImgDetMain"
    },
    {
        id: 7,
        name: "Hdd 2.5 2tb",
        price: 950000,
        images: "https://th.bing.com/th/id/OIP.bTZRScV5retfFEnXDVIf6AHaHa?rs=1&pid=ImgDetMain"
    }
];

export { productData };
export type { Product };