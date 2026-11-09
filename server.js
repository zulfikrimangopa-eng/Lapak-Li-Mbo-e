const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Mock Database
let db = {
    products: [
        { id: 1, outlet: 'Cabang Paris', name: 'Es Teler Spesial Durian', buyPrice: 12000, sellPrice: 18000, stock: 45, image: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=300' }
    ],
    transactions: []
};

// API: Ambil semua data
app.get('/api/data', (req, res) => {
    res.json(db);
});

// API: Tambah Produk
app.post('/api/products', (req, res) => {
    const { outlet, name, buyPrice, sellPrice, stock, imageBase64, imageName } = req.body;
    
    let finalImage = 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300';

    if (imageBase64 && imageName) {
        try {
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            const uniqueName = Date.now() + '_' + imageName.replace(/\s+/g, '_');
            const uploadPath = path.join(__dirname, 'public', 'uploads', uniqueName);
            
            // Buat folder uploads jika belum ada
            if (!fs.existsSync(path.join(__dirname, 'public', 'uploads'))) {
                fs.mkdirSync(path.join(__dirname, 'public', 'uploads'), { recursive: true });
            }

            fs.writeFileSync(uploadPath, base64Data, 'base64');
            finalImage = `/uploads/${uniqueName}`;
        } catch (err) {
            console.error("Gagal menyimpan gambar:", err);
        }
    }

    const newProduct = {
        id: Date.now(),
        outlet,
        name,
        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),
        stock: Number(stock),
        image: finalImage
    };
    db.products.push(newProduct);
    res.json({ success: true, product: newProduct });
});

// API: Edit Produk
app.put('/api/products/:id', (req, res) => {
    const productId = Number(req.params.id);
    const { outlet, name, buyPrice, sellPrice, stock, imageBase64, imageName } = req.body;
    
    const product = db.products.find(p => p.id === productId);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    product.outlet = outlet || product.outlet;
    product.name = name || product.name;
    product.buyPrice = buyPrice !== undefined ? Number(buyPrice) : product.buyPrice;
    product.sellPrice = sellPrice !== undefined ? Number(sellPrice) : product.sellPrice;
    product.stock = stock !== undefined ? Number(stock) : product.stock;

    if (imageBase64 && imageName) {
        try {
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            const uniqueName = Date.now() + '_' + imageName.replace(/\s+/g, '_');
            const uploadPath = path.join(__dirname, 'public', 'uploads', uniqueName);
            
            if (!fs.existsSync(path.join(__dirname, 'public', 'uploads'))) {
                fs.mkdirSync(path.join(__dirname, 'public', 'uploads'), { recursive: true });
            }

            fs.writeFileSync(uploadPath, base64Data, 'base64');
            product.image = `/uploads/${uniqueName}`;
        } catch (err) {
            console.error("Gagal memperbarui gambar:", err);
        }
    }

    res.json({ success: true, product });
});

// API: Hapus Produk
app.delete('/api/products/:id', (req, res) => {
    const productId = Number(req.params.id);
    const index = db.products.findIndex(p => p.id === productId);
    
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    db.products.splice(index, 1);
    res.json({ success: true, message: 'Produk berhasil dihapus' });
});

// API: Transaksi (Tanpa cetak struk otomatis)
app.post('/api/transactions', (req, res) => {
    const { outlet, items, total, modal, payment } = req.body;
    items.forEach(item => {
        const product = db.products.find(p => p.outlet === outlet && p.name === item.name);
        if (product) product.stock -= item.qty;
    });

    const newTx = { id: Date.now(), outlet, date: new Date().toISOString(), items, total, modal, payment };
    db.transactions.push(newTx);
    res.json({ success: true, transaction: newTx });
});
// Tangkap semua rute lain dan arahkan ke frontend (index.html)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// API: Reset Laporan Keuangan / Hapus Semua Transaksi
app.delete('/api/transactions/reset', (req, res) => {
    db.transactions = []; // Mengosongkan array transaksi
    res.json({ success: true, message: 'Laporan keuangan berhasil direset ke nol!' });
});
app.listen(PORT, () => {
    console.log(`Server ES Teler li Mbo'e berjalan di http://localhost:${PORT}`);
});