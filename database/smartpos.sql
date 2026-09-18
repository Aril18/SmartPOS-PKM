CREATE DATABASE IF NOT EXISTS smartpos_db;

USE smartpos_db;


-- =========================================
-- USERS
-- =========================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    username VARCHAR(50) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    role ENUM(
        'OWNER',
        'KASIR'
    ) NOT NULL,

    status ENUM(
        'AKTIF',
        'NONAKTIF'
    ) DEFAULT 'AKTIF',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- MENU
-- =========================================

CREATE TABLE menus (
    id INT AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(20) NOT NULL UNIQUE,

    name VARCHAR(150) NOT NULL,

    category VARCHAR(100),

    price DECIMAL(12,2) NOT NULL,

    portion_usage DECIMAL(8,2) DEFAULT 0,

    status ENUM(
        'TERSEDIA',
        'TIDAK_TERSEDIA'
    ) DEFAULT 'TERSEDIA',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- PRODUCTION
-- =========================================

CREATE TABLE production (
    id INT AUTO_INCREMENT PRIMARY KEY,

    production_date DATE NOT NULL,

    ingredient VARCHAR(150),

    stock_weight DECIMAL(10,2),

    estimated_portion DECIMAL(10,2),

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- TRANSACTIONS
-- =========================================

CREATE TABLE transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    transaction_code VARCHAR(50) NOT NULL UNIQUE,

    cashier_id INT NOT NULL,

    transaction_date DATE NOT NULL,

    payment_method ENUM(
        'TUNAI',
        'QRIS',
        'TRANSFER'
    ) DEFAULT 'TUNAI',

    total DECIMAL(12,2) NOT NULL,

    status ENUM(
        'SUCCESS',
        'VOID'
    ) DEFAULT 'SUCCESS',

    void_reason TEXT,

    voided_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cashier_id)
        REFERENCES users(id)
);


-- =========================================
-- TRANSACTION ITEMS
-- =========================================

CREATE TABLE transaction_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    transaction_id BIGINT NOT NULL,

    menu_id INT NOT NULL,

    quantity INT NOT NULL,

    price DECIMAL(12,2) NOT NULL,

    portion_usage DECIMAL(8,2) DEFAULT 0,

    subtotal DECIMAL(12,2) NOT NULL,

    FOREIGN KEY (transaction_id)
        REFERENCES transactions(id),

    FOREIGN KEY (menu_id)
        REFERENCES menus(id)
);


-- =========================================
-- WASTE
-- =========================================

CREATE TABLE waste (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    menu_id INT NULL,

    item_name VARCHAR(150),

    quantity DECIMAL(10,2) NOT NULL,

    portion_usage DECIMAL(8,2) DEFAULT 1,

    reason VARCHAR(255),

    notes TEXT,

    waste_date DATE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id),

    FOREIGN KEY (menu_id)
        REFERENCES menus(id)
);


-- =========================================
-- STOCK OPNAME
-- =========================================

CREATE TABLE stock_opnames (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    opname_date DATE NOT NULL,

    system_stock DECIMAL(10,2),

    physical_stock DECIMAL(10,2),

    stock_difference DECIMAL(10,2),

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
);


-- =========================================
-- CLOSING
-- =========================================

CREATE TABLE closings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    cashier_id INT NOT NULL,

    closing_date DATE NOT NULL,

    transaction_count INT DEFAULT 0,

    void_count INT DEFAULT 0,

    cash_sales DECIMAL(12,2) DEFAULT 0,

    non_cash_sales DECIMAL(12,2) DEFAULT 0,

    system_cash DECIMAL(12,2) DEFAULT 0,

    actual_cash DECIMAL(12,2) DEFAULT 0,

    cash_difference DECIMAL(12,2) DEFAULT 0,

    status ENUM(
        'SESUAI',
        'KURANG',
        'LEBIH'
    ),

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cashier_id)
        REFERENCES users(id)
);


-- =========================================
-- AUDIT LOG
-- =========================================

CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    action VARCHAR(100) NOT NULL,

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
);


INSERT INTO users
(name, username, password, role, status)
VALUES

(
    'Pemilik Usaha',
    'owner',
    'owner123',
    'OWNER',
    'AKTIF'
),

(
    'Made',
    'made',
    '123456',
    'KASIR',
    'AKTIF'
),

(
    'Putu',
    'putu',
    '123456',
    'KASIR',
    'AKTIF'
);

-- =========================================
-- SEED MENU SARI KEMBAR 99
-- =========================================

INSERT INTO menus
(
    code,
    name,
    category,
    price,
    portion_usage,
    status
)
VALUES

(
    'M001',
    'Nasi Babi Guling Biasa',
    'Paket Nasi',
    25000,
    1,
    'TERSEDIA'
),

(
    'M002',
    'Nasi Babi Guling Komplit',
    'Paket Nasi',
    40000,
    1,
    'TERSEDIA'
),

(
    'M003',
    'Nasi Babi Guling Spesial',
    'Paket Nasi',
    50000,
    1,
    'TERSEDIA'
),

(
    'M004',
    'Nasi Ayam Betutu',
    'Paket Nasi',
    20000,
    0,
    'TERSEDIA'
),

(
    'M005',
    'Daging Guling',
    'Daging & Lauk',
    30000,
    1,
    'TERSEDIA'
),

(
    'M006',
    'Kulit',
    'Daging & Lauk',
    30000,
    1,
    'TERSEDIA'
),

(
    'M007',
    'Urutan',
    'Daging & Lauk',
    30000,
    1,
    'TERSEDIA'
),

(
    'M008',
    'Sate',
    'Daging & Lauk',
    50000,
    1,
    'TERSEDIA'
),

(
    'M009',
    'Daging Merah',
    'Gorengan',
    30000,
    1,
    'TERSEDIA'
),

(
    'M010',
    'Iga Goreng',
    'Gorengan',
    30000,
    1,
    'TERSEDIA'
),

(
    'M011',
    'Dendeng Manis',
    'Gorengan',
    30000,
    1,
    'TERSEDIA'
),

(
    'M012',
    'Usus Goreng',
    'Gorengan',
    30000,
    1,
    'TERSEDIA'
),

(
    'M013',
    'Paru Goreng',
    'Gorengan',
    30000,
    1,
    'TERSEDIA'
),

(
    'M014',
    'Ati Goreng',
    'Gorengan',
    30000,
    1,
    'TERSEDIA'
),

(
    'M015',
    'Sup Balung',
    'Sayur & Pendamping',
    15000,
    1,
    'TERSEDIA'
),

(
    'M016',
    'Sayur Gonda',
    'Sayur & Pendamping',
    15000,
    0,
    'TERSEDIA'
),

(
    'M017',
    'Lawar',
    'Sayur & Pendamping',
    15000,
    0,
    'TERSEDIA'
),

(
    'M018',
    'Sate Lilit Ayam',
    'Daging & Lauk',
    30000,
    0,
    'TERSEDIA'
)

ON DUPLICATE KEY UPDATE

name = VALUES(name),
category = VALUES(category),
price = VALUES(price),
portion_usage = VALUES(portion_usage),
status = VALUES(status);