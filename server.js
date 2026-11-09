const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// --- NOMOR 2: FUNGSI HELPER PERSISTENSI JSON ---
const DB_PATH = path.join(__dirname, 'db.json');

function loadData() {
    if (!fs.existsSync(DB_PATH)) {
        const initialData = { products: [], transactions: [] };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error("Gagal membaca db.json", err);
        return { products: [], transactions: [] };
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Gagal menyimpan data ke db.json:", err);
    }
}

let db = loadData();

// --- RUTE API ---

// 1. Get All Data
app.get('/api/data', (req, res) => {
    res.json(db);
});

// 2. Tambah Produk Baru
app.post('/api/products', (req, res) => {
    const { outlet, name, buyPrice, sellPrice, stock, imageBase64 } = req.body;
    const newProduct = {
        id: Date.now(),
        outlet,
        name,
        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),
        stock: Number(stock),
        image: imageBase64 || "https://via.placeholder.com/150"
    };
    db.products.push(newProduct);
    
    saveData(db); // <-- NOMOR 3: SIMPAN KE DB.JSON
    res.json({ success: true, product: newProduct });
});

// 3. Edit Produk
app.put('/api/products/:id', (req, res) => {
    const id = Number(req.params.id);
    const { outlet, name, buyPrice, sellPrice, stock, imageBase64 } = req.body;
    const index = db.products.findIndex(p => p.id === id);
    if (index !== -1) {
        db.products[index] = {
            ...db.products[index],
            outlet,
            name,
            buyPrice: Number(buyPrice),
            sellPrice: Number(sellPrice),
            stock: Number(stock),
            ...(imageBase64 && { image: imageBase64 })
        };
        
        saveData(db); // <-- NOMOR 3: SIMPAN KE DB.JSON
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: "Produk tidak ditemukan" });
    }
});

// 4. Hapus Produk
app.delete('/api/products/:id', (req, res) => {
    const id = Number(req.params.id);
    db.products = db.products.filter(p => p.id !== id);
    
    saveData(db); // <-- NOMOR 3: SIMPAN KE DB.JSON
    res.json({ success: true });
});

// 5. Transaksi Baru (Checkout)
app.post('/api/transactions', (req, res) => {
    const { outlet, items, total, modal, payment } = req.body;
    const newTx = {
        id: Date.now(),
        outlet,
        items,
        total,
        modal,
        payment,
        date: new Date().toISOString()
    };
    db.transactions.push(newTx);
    
    // Potong stok produk otomatis
    items.forEach(item => {
        const prod = db.products.find(p => p.name === item.name);
        if (prod) prod.stock -= item.qty;
    });

    saveData(db); // <-- NOMOR 3: SIMPAN KE DB.JSON
    res.json({ success: true });
});

// 6. Reset Laporan Keuangan
app.delete('/api/transactions/reset', (req, res) => {
    db.transactions = [];
    
    saveData(db); // <-- NOMOR 3: SIMPAN KE DB.JSON
    res.json({ success: true, message: 'Laporan keuangan berhasil direset ke nol!' });
});

app.listen(PORT, () => {
    console.log(`Server ES Teler li Mbo'e berjalan di port ${PORT}`);
});