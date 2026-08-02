-- Coorg Harvest Database Table Schema Setup
-- Use these schemas to initialize your MySQL database on Hostinger (or let the Node.js server auto-generate them).

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
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
  reviews JSON -- Stores array of customer reviews
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
  code VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'percent' or 'fixed'
  value DECIMAL(10, 2) NOT NULL,
  description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) PRIMARY KEY,
  date VARCHAR(100),
  name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  items JSON, -- Stores cart items detail
  subtotal DECIMAL(10, 2),
  discount DECIMAL(10, 2),
  shipping DECIMAL(10, 2),
  total DECIMAL(10, 2),
  paymentMethod VARCHAR(50),
  status VARCHAR(50),
  trackingId VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text TEXT,
  time VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
