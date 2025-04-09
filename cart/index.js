"use strict";
const productData = [
    { id: 1, name: "Mouse", price: 450000, images: "https://m.media-amazon.com/images/I/61pDShoLXqL._AC_SL1000_.jpg" },
    { id: 2, name: "Ssd Nvme gen 4 2tb", price: 2200000, images: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6509/6509710_sd.jpg" },
    { id: 3, name: "Ssd Nvme gen 4 1tb", price: 1000000, images: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6509/6509710_sd.jpg" },
    { id: 4, name: "Ssd Nvme gen 4 4tb", price: 4000000, images: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6509/6509710_sd.jpg" },
];
let cart = [];
const itemElements = new Map();
let modal = { isShow: false, message: "" };
// Fungsi utama
const CartManager = {
    initProducts() {
        const container = document.getElementById('products');
        productData.forEach(product => {
            const div = document.createElement('div');
            div.className = 'product';
            div.innerHTML = `
                <div class="product-img">
                    <img src=${product.images} alt=${product.name}/>
                </div>
                <h4>${product.name}</h4>
                <p>Rp${product.price}</p>
                <button class="add-btn">Tambah</button>
            `;
            // Pastikan elemen sudah dibuat sebelum menambahkan event listener
            const button = div.querySelector('.add-btn');
            if (button) {
                button.addEventListener('click', () => this.addToCart(product.id));
            }
            container.appendChild(div);
        });
    },
    addToCart(id) {
        const product = productData.find(p => p.id === id);
        if (!product)
            return;
        const existing = cart.find(item => item.id === id);
        if (existing) {
            existing.quantity++;
            this.updateCartItem(existing);
        }
        else {
            const newItem = Object.assign(Object.assign({}, product), { quantity: 1 });
            cart.push(newItem);
            this.renderCartItem(newItem);
        }
        this.updateTotal();
    },
    renderCartItem(item) {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="product-img">
                <img src=${item.images} alt=${item.name}/>
            </div>
            <div>${item.name}</div>
            <div>Qty: <span class="qty">${item.quantity}</span></div>
            <button class="inc">+</button>
            <button class="dec">-</button>
            <button class="remove">Hapus</button>
        `;
        // Tambahkan null check untuk semua event listener
        const incBtn = div.querySelector('.inc');
        const decBtn = div.querySelector('.dec');
        const removeBtn = div.querySelector('.remove');
        if (incBtn)
            incBtn.addEventListener('click', () => this.increment(item.id));
        if (decBtn)
            decBtn.addEventListener('click', () => this.decrement(item.id));
        if (removeBtn)
            removeBtn.addEventListener('click', () => this.removeItem(item.id));
        document.getElementById('cartItems').appendChild(div);
        itemElements.set(item.id, div);
    },
    updateCartItem(item) {
        const element = itemElements.get(item.id);
        if (element) {
            const qtySpan = element.querySelector('.qty');
            if (qtySpan)
                qtySpan.textContent = item.quantity;
        }
    },
    updateTotal() {
        const totalItemEl = document.getElementById('totalItem');
        const totalPriceEl = document.getElementById('totalPrice');
        if (totalItemEl && totalPriceEl) {
            totalItemEl.textContent = cart.reduce((acc, item) => acc + item.quantity, 0).toString();
            totalPriceEl.textContent = cart.reduce((acc, item) => acc + (item.quantity * item.price), 0).toString();
        }
    },
    increment(id) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity++;
            this.updateCartItem(item);
            this.updateTotal();
        }
    },
    decrement(id) {
        const index = cart.findIndex(i => i.id === id);
        if (index === -1)
            return;
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
            this.updateCartItem(cart[index]);
            this.updateTotal();
        }
        else {
            this.removeItem(id);
        }
    },
    removeItem(id) {
        const index = cart.findIndex(i => i.id === id);
        if (index === -1)
            return;
        cart.splice(index, 1);
        const element = itemElements.get(id);
        if (element) {
            element.remove();
            itemElements.delete(id);
        }
        this.updateTotal();
    },
    showModal(message) {
        const modalEl = document.getElementById('modal');
        const modalText = document.getElementById('modalText');
        if (modalEl && modalText) {
            modal.isShow = true;
            modal.message = message;
            modalEl.style.display = 'block';
            modalText.textContent = message;
        }
    },
    hideModal() {
        const modalEl = document.getElementById('modal');
        if (modalEl) {
            modal.isShow = false;
            modalEl.style.display = 'none';
        }
    },
    checkOut() {
        if (cart.length === 0) {
            this.showModal("Keranjang kosong!");
            return;
        }
        this.showModal(`Terima kasih! Total: Rp${this.calculateTotal()}`);
        cart = [];
        itemElements.clear();
        const cartItemsEl = document.getElementById('cartItems');
        if (cartItemsEl)
            cartItemsEl.innerHTML = '';
        this.updateTotal();
    },
    calculateTotal() {
        return cart.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    }
};
// Inisialisasi setelah DOM siap
document.addEventListener('DOMContentLoaded', () => {
    CartManager.initProducts();
    // Tambahkan event listener dengan null check
    const checkoutBtn = document.getElementById('checkout-btn');
    const clearBtn = document.getElementById('clear-btn');
    if (checkoutBtn)
        checkoutBtn.addEventListener('click', () => CartManager.checkOut());
    if (clearBtn)
        clearBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                CartManager.showModal("Keranjang telah dikosongkan");
            }
            else {
                CartManager.showModal("Kamu belum menambahkan item apapun");
            }
        });
});
