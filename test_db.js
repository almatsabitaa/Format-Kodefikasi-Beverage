const mysql = require('mysql2/promise');
    
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'ABCExpire25!DB47',
    database: 'beverage_db',
    port: 3306,
};
    
async function testConnection() {
    try {
        const pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT "Koneksi Berhasil!" as status');
        console.log(rows[0].status);
        connection.release();
    } catch (error) {
        console.error('Koneksi GAGAL! Error:', error.message);
    }
}
testConnection();