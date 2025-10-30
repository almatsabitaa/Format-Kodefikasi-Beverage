CREATE DATABASE beverage_db;
USE beverage_db;

CREATE TABLE master_produk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(10) NOT NULL,
    jenis_kemasan VARCHAR(20) NOT NULL,
    shelf_life_bulan INT NOT NULL,
    kode_produk VARCHAR(2) NOT NULL,
    UNIQUE KEY unique_product (sku, jenis_kemasan)
);

INSERT INTO master_produk (sku, jenis_kemasan, shelf_life_bulan, kode_produk) VALUES
('NTOR', 'PET', 13, 'TO'),
('NTHN', 'PET', 13, 'TH'),
('NTHN', 'PAPER PACK', 13, 'TH'),
('NTLS', 'PET', 13, 'TL'),
('NTRJ', 'PET', 13, 'TR'),
('NILC', 'PET', 12, 'TC'),
('NUYT', 'PET', 13, 'TY'),
('NUYB', 'PET', 12, 'TB'),
('MTOR', 'PET', 13, 'MO'),
('MTTK', 'PET', 13, 'MT'),
('MTCH', 'PET', 13, 'MC'),
('MTCH', 'PAPER PACK', 12, 'MC'),
('MTML', 'PET', 12, 'ML');