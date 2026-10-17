-- Coorg Harvest Database Table Schema Setup
-- Use these schemas to initialize your MySQL database on Hostinger (or let the Node.js server auto-generate them).

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  costPrice DECIMAL(10, 2) DEFAULT 0,
  oldPrice DECIMAL(10, 2),
  rating DECIMAL(3, 2),
  ratingCount INT,
  category VARCHAR(255),
  image TEXT,
  images JSON, -- Stores array of image URLs
  description TEXT,
  ingredients JSON, -- Stores array of ingredients
  benefits JSON, -- Stores array of benefits
  `usage` TEXT, -- usage instructions (escaped as usage is a reserved word)
  origin VARCHAR(255),
  stock INT DEFAULT 0,
  badge VARCHAR(255),
  reviews JSON, -- Stores array of customer reviews
  gstRate DECIMAL(5, 2) DEFAULT 5.00,
  hsnCode VARCHAR(50) DEFAULT '0904'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
  code VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'percent' or 'fixed'
  value DECIMAL(10, 2) NOT NULL,
  description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. ORDERS / SALES INVOICES TABLE (Supports Multi-channel: Website, Amazon, Flipkart, Offline)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) PRIMARY KEY,
  date VARCHAR(100),
  name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  items JSON, -- Stores order items detail
  subtotal DECIMAL(10, 2),
  discount DECIMAL(10, 2),
  shipping DECIMAL(10, 2),
  total DECIMAL(10, 2),
  paymentMethod VARCHAR(50),
  status VARCHAR(50),
  trackingId VARCHAR(255),
  couponCode VARCHAR(255),
  channel VARCHAR(100) DEFAULT 'Website',
  costPrice DECIMAL(10, 2) DEFAULT 0,
  deliveryCost DECIMAL(10, 2) DEFAULT 0,
  commission DECIMAL(10, 2) DEFAULT 0,
  packingCost DECIMAL(10, 2) DEFAULT 0,
  netProfit DECIMAL(10, 2) DEFAULT 0,
  isReturned TINYINT(1) DEFAULT 0,
  returnCost DECIMAL(10, 2) DEFAULT 0,
  returnLoss DECIMAL(10, 2) DEFAULT 0,
  customerGstin VARCHAR(50) DEFAULT NULL,
  gstRate DECIMAL(5, 2) DEFAULT 5.00,
  taxableAmount DECIMAL(10, 2) DEFAULT 0,
  cgst DECIMAL(10, 2) DEFAULT 0,
  sgst DECIMAL(10, 2) DEFAULT 0,
  igst DECIMAL(10, 2) DEFAULT 0,
  metaData JSON DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. PURCHASES TABLE (Vendor Inward Invoices / CRM)
CREATE TABLE IF NOT EXISTS purchases (
  id VARCHAR(255) PRIMARY KEY,
  invoiceNo VARCHAR(255) NOT NULL,
  vendorName VARCHAR(255) NOT NULL,
  vendorGstin VARCHAR(50),
  vendorPhone VARCHAR(50),
  date VARCHAR(100) NOT NULL,
  items JSON NOT NULL, -- [{ productId, productName, qty, unitCost, gstRate, taxableAmount, cgst, sgst, igst, totalAmount }]
  subtotal DECIMAL(10, 2) NOT NULL,
  taxAmount DECIMAL(10, 2) NOT NULL,
  totalAmount DECIMAL(10, 2) NOT NULL,
  paymentStatus VARCHAR(50) DEFAULT 'Paid',
  paymentMethod VARCHAR(50) DEFAULT 'Bank Transfer',
  notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. DAMAGED STOCK TABLE (Loss & Waste Tracking)
CREATE TABLE IF NOT EXISTS damaged_stock (
  id VARCHAR(255) PRIMARY KEY,
  productId VARCHAR(255) NOT NULL,
  productName VARCHAR(255) NOT NULL,
  qty INT NOT NULL,
  unitCost DECIMAL(10, 2) NOT NULL,
  totalLoss DECIMAL(10, 2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  date VARCHAR(100) NOT NULL,
  notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text TEXT,
  time VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(255) PRIMARY KEY,
  setting_value TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
