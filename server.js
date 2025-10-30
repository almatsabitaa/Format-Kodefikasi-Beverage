const express = require('express');
const mysql = require('mysql2/promise'); 
const cors = require('cors'); 

const app = express();
const port = 3000; 

app.use(cors()); 
app.use(express.json()); 

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'ABCExpire25!DB47', 
    database: 'beverage_db',
    port: 3306, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const ADMIN_USER = {
    username: 'QABev',
    password: '123sampe10' 
};

const pool = mysql.createPool(dbConfig);
async function getConnection() {
    return await pool.getConnection();
}

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
        res.status(200).json({ 
            message: 'Login berhasil!',
            token: 'valid_session_token'
        });
    } else {
        res.status(401).json({ 
            message: 'Username atau password salah.' 
        });
    }
});

app.get('/api/products', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM master_produk ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Gagal mengambil data produk. Cek koneksi database.');
    } finally {
        if (connection) connection.release(); 
    }
});

app.post('/api/products', async (req, res) => {
    const { sku, jenis_kemasan, shelf_life_bulan, kode_produk } = req.body; 
    let connection;
    try {
        connection = await getConnection();
        const [existing] = await connection.execute(
            'SELECT id FROM master_produk WHERE sku = ? AND jenis_kemasan = ?', 
            [sku, jenis_kemasan]
        );
        if (existing.length > 0) {
            return res.status(409).send('Kombinasi SKU dan Jenis Kemasan sudah ada.');
        }

        const query = 'INSERT INTO master_produk (sku, jenis_kemasan, shelf_life_bulan, kode_produk) VALUES (?, ?, ?, ?)';
        const [result] = await connection.execute(query, [sku, jenis_kemasan, shelf_life_bulan, kode_produk]);
        
        res.status(201).json({ 
            message: 'Produk berhasil ditambahkan', 
            id: result.insertId 
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).send('Gagal menambahkan produk. Cek log server.');
    } finally {
        if (connection) connection.release(); 
    }
});

app.put('/api/products/:id', async (req, res) => {
    const id = req.params.id;
    const { sku, jenis_kemasan, shelf_life_bulan, kode_produk } = req.body;
    let connection;
    try {
        connection = await getConnection();

        const [existing] = await connection.execute(
            'SELECT id FROM master_produk WHERE sku = ? AND jenis_kemasan = ? AND id != ?', 
            [sku, jenis_kemasan, id]
        );
        if (existing.length > 0) {
            return res.status(409).send('Kombinasi SKU dan Jenis Kemasan sudah digunakan oleh produk lain.');
        }

        const query = 'UPDATE master_produk SET sku = ?, jenis_kemasan = ?, shelf_life_bulan = ?, kode_produk = ? WHERE id = ?';
        const [result] = await connection.execute(query, [sku, jenis_kemasan, shelf_life_bulan, kode_produk, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).send('Produk tidak ditemukan atau tidak ada perubahan.');
        }

        res.status(200).json({ message: 'Produk berhasil diperbarui' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send('Gagal memperbarui produk. Cek log server.');
    } finally {
        if (connection) connection.release(); 
    }
});

app.delete('/api/products/:id', async (req, res) => {
    const id = req.params.id;
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.execute('DELETE FROM master_produk WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).send('Produk tidak ditemukan.');
        }
        
        res.status(200).json({ message: 'Produk berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send('Gagal menghapus produk. Cek log server.');
    } finally {
        if (connection) connection.release(); 
    }
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});