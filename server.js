const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const fs = require('fs');
const multer = require('multer');
const { Client } = require('ssh2');
const net = require('net');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Define local and persistent upload directories
const localUploadDir = path.join(__dirname, 'images', 'uploads');
let persistentUploadDir = path.join(__dirname, '..', 'persistent_uploads');

// Check if running on Hostinger production VPS to use a truly persistent path outside the builds folder
if (__dirname.includes('u279206464')) {
  persistentUploadDir = '/home/u279206464/domains/coorgharvest.com/persistent_uploads';
}

// Ensure both directories exist
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}
if (!fs.existsSync(persistentUploadDir)) {
  fs.mkdirSync(persistentUploadDir, { recursive: true });
}

// Multer Storage Configuration (saves to the persistent uploads directory)
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, persistentUploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Enable JSON body parsing for API requests
app.use(express.json());

// Serve static assets from the current directory
app.use(express.static(path.join(__dirname)));

// Serve uploads from local uploads (repository defaults) first, then fallback to persistent uploads
app.use('/images/uploads', express.static(localUploadDir));
app.use('/images/uploads', express.static(persistentUploadDir));

// Global Database Pool and SSH Tunnel variables
let db = null;
let dbConnected = false;
let sshTunnelServer = null;
let sshTunnelClient = null;

// Graceful SSH Tunnel Shutdown
function closeSshTunnel() {
  if (sshTunnelServer) {
    try {
      sshTunnelServer.close();
      console.log('🔌 Local SSH tunnel server closed.');
    } catch (e) {}
    sshTunnelServer = null;
  }
  if (sshTunnelClient) {
    try {
      sshTunnelClient.end();
      console.log('🔒 SSH connection ended.');
    } catch (e) {}
    sshTunnelClient = null;
  }
}

// Establish SSH connection and set up local port forwarding to remote MySQL
function setupSshTunnel() {
  return new Promise((resolve, reject) => {
    if (process.env.SSH_TUNNEL_ENABLED !== 'true') {
      return resolve(null);
    }

    console.log('🔒 SSH Tunnel enabled. Initiating secure connection to Hostinger...');
    const sshClient = new Client();

    sshClient.on('ready', () => {
      console.log('✅ SSH Connection Ready. Setting up port forwarding...');
      
      const localPort = parseInt(process.env.DB_LOCAL_PORT || '3307');
      const remoteHost = '127.0.0.1'; // Hostinger MySQL local loopback
      const remotePort = parseInt(process.env.DB_PORT || '3306');

      const server = net.createServer((socket) => {
        try {
          // Verify client connection is active
          if (!sshClient.authenticated) {
            console.error('❌ SSH Client not authenticated. Cannot forward socket.');
            socket.end();
            return;
          }
          sshClient.forwardOut(
            '127.0.0.1',
            socket.remotePort,
            remoteHost,
            remotePort,
            (err, stream) => {
              if (err) {
                console.error('❌ SSH Port Forwarding failed:', err);
                socket.end();
                return;
              }
              socket.pipe(stream).pipe(socket);
            }
          );
        } catch (forwardError) {
          console.error('❌ SSH Port Forwarding exception:', forwardError.message);
          socket.end();
        }
      });

      server.listen(localPort, '127.0.0.1', (err) => {
        if (err) {
          sshClient.end();
          return reject(err);
        }
        console.log(`🔌 SSH Tunnel listening on 127.0.0.1:${localPort} -> Remote ${remoteHost}:${remotePort}`);
        sshTunnelServer = server;
        sshTunnelClient = sshClient;
        resolve(localPort);
      });

      server.on('error', (err) => {
        console.error('❌ Local SSH tunnel server error:', err);
      });
    });

    sshClient.on('error', (err) => {
      console.error('❌ SSH Tunnel Connection Error:', err);
      reject(err);
    });

    sshClient.on('close', () => {
      console.log('🔌 SSH connection closed.');
    });

    sshClient.connect({
      host: process.env.SSH_HOST,
      port: parseInt(process.env.SSH_PORT || '22'),
      username: process.env.SSH_USER,
      password: process.env.SSH_PASSWORD
    });
  });
}

// Graceful process shutdown listener
const gracefulShutdown = async () => {
  console.log('🌿 Shutting down Coorg Harvest server gracefully...');
  closeSshTunnel();
  if (db) {
    try {
      await db.end();
      console.log('📦 Database pool closed.');
    } catch (e) {}
  }
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Default Seed Data
const seedProducts = [
  {
    id: "coffee-almond",
    name: "Coorg Almond Coffee",
    price: 380,
    oldPrice: null,
    rating: 4.8,
    ratingCount: 15,
    category: "Coffee Collection",
    image: "images/uploads/coorg almond coffee.jpeg",
    images: ["images/uploads/coorg almond coffee.jpeg"],
    description: "Premium single-estate coffee infused with the rich, nutty flavor of toasted almonds. Meticulously roasted to highlight the perfect balance of cocoa notes and almond aroma.",
    ingredients: ["Shade-grown Arabica ground coffee", "Natural Almond Extract"],
    benefits: ["Boosts cognitive focus and morning alertness", "Rich in natural antioxidants and essential coffee oils", "Naturally smooth and low-acidity profile"],
    usage: "Ideal for French press or South Indian filter drip brewing.",
    origin: "Misty Valley Plantation, Gonikopal, South Kodagu",
    stock: 30,
    badge: "New Arrival",
    reviews: []
  },
  {
    id: "coffee-caramel",
    name: "Coorg Caramel Coffee",
    price: 390,
    oldPrice: null,
    rating: 4.7,
    ratingCount: 12,
    category: "Coffee Collection",
    image: "images/uploads/coorg caramel coffee.jpeg",
    images: ["images/uploads/coorg caramel coffee.jpeg"],
    description: "Smooth medium-roasted coffee blended with the sweet, buttery notes of gourmet caramel. A delightful, aromatic dessert coffee that satisfies sweet cravings.",
    ingredients: ["Shade-grown Arabica ground coffee", "Natural Caramel Flavoring"],
    benefits: ["Exquisite sweet caramel aroma and smooth finish", "Clean caffeine boost without sugar crashes", "Perfect for making gourmet hot or cold lattes"],
    usage: "Brew using filter drip or cold brew method. Add milk and sweeten to taste.",
    origin: "Misty Valley Plantation, Gonikopal, South Kodagu",
    stock: 25,
    badge: "Indulgent",
    reviews: []
  },
  {
    id: "coffee-choco-orange",
    name: "Coorg Choco Orange Coffee",
    price: 420,
    oldPrice: null,
    rating: 4.9,
    ratingCount: 18,
    category: "Coffee Collection",
    image: "images/uploads/coorg choco orange coffee.jpeg",
    images: ["images/uploads/coorg choco orange coffee.jpeg"],
    description: "An indulgent and sophisticated blend of premium Kodagu coffee, rich dark cocoa undertones, and a bright splash of citrusy orange zest.",
    ingredients: ["Shade-grown Arabica coffee", "Dark Cocoa Powder", "Dried Orange Peel extract"],
    benefits: ["Unique gourmet flavor profile (sweet cocoa & tangy citrus)", "High antioxidant counts from pure cocoa and coffee beans", "Elevates mood and energy levels naturally"],
    usage: "Brew in drip filter or espresso maker. Serve black or with a splash of milk.",
    origin: "Misty Valley Plantation, Gonikopal, South Kodagu",
    stock: 20,
    badge: "Unique Blend",
    reviews: []
  },
  {
    id: "coffee-roasted-instant",
    name: "Coorg Roasted Arabica & Robusta Instant Coffee",
    price: 320,
    oldPrice: null,
    rating: 4.8,
    ratingCount: 22,
    category: "Coffee Collection",
    image: "images/uploads/coorg rosted arabica and robusta instent cofee.jpeg",
    images: ["images/uploads/coorg rosted arabica and robusta instent cofee.jpeg"],
    description: "A premium quick-brew blend of handpicked shade-grown Arabica and bold Robusta beans. Dissolves instantly for a strong, velvety cup with a golden crema.",
    ingredients: ["Spray-dried soluble Arabica coffee", "Robusta coffee powder"],
    benefits: ["Instant preparation—requires no brewing equipment", "Strong, full-bodied taste with a velvety crema layer", "Ideal travel-friendly energy companion"],
    usage: "Add 1-2 tsp of instant coffee to hot water or milk, stir well, and sweeten.",
    origin: "Estate Slopes, Somwarpet, North Kodagu",
    stock: 50,
    badge: "Quick Brew",
    reviews: []
  },
  {
    id: "coffee-vanilla",
    name: "Coorg Vanilla Coffee",
    price: 380,
    oldPrice: null,
    rating: 4.8,
    ratingCount: 16,
    category: "Coffee Collection",
    image: "images/uploads/coorg vanilla coffee.jpeg",
    images: ["images/uploads/coorg vanilla coffee.jpeg"],
    description: "A comforting cup of smooth estate coffee blended with the sweet, warm, and creamy flavor of natural Madagascan vanilla bean extracts.",
    ingredients: ["Arabica ground coffee", "Natural Vanilla Bean extract"],
    benefits: ["Highly aromatic and soothing vanilla nodes", "Naturally sweet notes reduce the need for extra sweeteners", "Extremely smooth body and clean finish"],
    usage: "Best prepared as a drip coffee, pour-over, or French press.",
    origin: "Misty Valley Plantation, Gonikopal, South Kodagu",
    stock: 35,
    badge: "Smooth",
    reviews: []
  },
  {
    id: "teas-ginger",
    name: "Coorg Ginger Tea",
    price: 240,
    oldPrice: null,
    rating: 4.9,
    ratingCount: 25,
    category: "Herbal Teas",
    image: "images/uploads/coorg ginger tea.jpeg",
    images: ["images/uploads/coorg ginger tea.jpeg"],
    description: "A fiery and warming infusion of organic black tea leaves and hand-sorted Kodagu ginger root. Perfect for detoxifying and comforting cold days.",
    ingredients: ["Black Tea leaves", "Dried Ginger root shards"],
    benefits: ["Relieves sore throat, cough, and congestion", "Aids digestion and alleviates stomach bloating", "Warming properties boost blood circulation"],
    usage: "Steep 1 tsp in boiling water for 3-5 minutes. Strain and enjoy with lemon and honey.",
    origin: "Coorg Estate Slopes, Somwarpet, North Kodagu",
    stock: 40,
    badge: "Warming",
    reviews: []
  },
  {
    id: "teas-lychee",
    name: "Coorg Lychee Tea",
    price: 260,
    oldPrice: null,
    rating: 4.7,
    ratingCount: 14,
    category: "Herbal Teas",
    image: "images/uploads/coorg lychee tea.jpeg",
    images: ["images/uploads/coorg lychee tea.jpeg"],
    description: "A sweet, fruity, and refreshing tea blend infused with the delicate tropical essence of ripe lychee fruits. A sensory floral experience.",
    ingredients: ["Black tea leaves", "Dried Lychee fruit pulp bits", "Natural Lychee extract"],
    benefits: ["Rich in Vitamin C and immune-supporting fruit polyphenols", "Incredibly refreshing when served iced on hot afternoons", "Natural, exotic sweet aroma"],
    usage: "Brew hot, let it cool, and pour over ice with fresh mint leaves.",
    origin: "Coorg Estate Slopes, Somwarpet, North Kodagu",
    stock: 30,
    badge: "Exotic",
    reviews: []
  },
  {
    id: "teas-mango",
    name: "Coorg Mango Tea",
    price: 260,
    oldPrice: null,
    rating: 4.8,
    ratingCount: 19,
    category: "Herbal Teas",
    image: "images/uploads/coorg mango tea.jpeg",
    images: ["images/uploads/coorg mango tea.jpeg"],
    description: "A tropical getaway in a cup, featuring premium black tea blended with sun-dried mango pieces and a vibrant mango fruit aroma.",
    ingredients: ["Assam black tea", "Sun-dried Mango pieces", "natural Mango flavoring"],
    benefits: ["Sweet tropical taste that lifts energy levels", "Contains beneficial fruit flavonoids and antioxidants", "Ideal base for exotic summer mocktails"],
    usage: "Steep in boiling water for 4 minutes. Serve chilled with a squeeze of lime.",
    origin: "Coorg Estate Slopes, Somwarpet, North Kodagu",
    stock: 30,
    badge: "Fruity",
    reviews: []
  },
  {
    id: "teas-masala",
    name: "Coorg Masala Tea",
    price: 250,
    oldPrice: null,
    rating: 4.9,
    ratingCount: 38,
    category: "Herbal Teas",
    image: "images/uploads/coorg masala tea.jpeg",
    images: ["images/uploads/coorg masala tea.jpeg"],
    description: "A robust and warming blend of strong Assam CTC tea and authentic Coorg estate spices, including green cardamom, cinnamon, cloves, and ginger.",
    ingredients: ["Black CTC tea", "Cardamom", "Cinnamon", "Clove", "Black Pepper", "Ginger"],
    benefits: ["Traditional Ayurvedic immunity and metabolism booster", "Rich, spicy aroma stimulates focus and clarity", "Supports digestion and relieves respiratory fatigue"],
    usage: "Boil with equal parts water and milk, add 1 tsp tea, simmer for 3 minutes, strain and serve.",
    origin: "Coorg Estate Slopes, Somwarpet, North Kodagu",
    stock: 45,
    badge: "Best Seller",
    reviews: []
  },
  {
    id: "teas-raspberry",
    name: "Coorg Raspberry Tea",
    price: 270,
    oldPrice: null,
    rating: 4.8,
    ratingCount: 17,
    category: "Herbal Teas",
    image: "images/uploads/coorg raspberry tea.jpeg",
    images: ["images/uploads/coorg raspberry tea.jpeg"],
    description: "A tart and vibrant red berry infusion of premium tea leaves and natural raspberry extract. Fruity, sweet, and comfortingly rich in flavor.",
    ingredients: ["Black tea leaves", "Dried Raspberry bits", "Hibiscus petals", "Natural Raspberry flavor"],
    benefits: ["Vibrant berry antioxidants protect cell health", "Fruity tart notes elevate mood and sensory comfort", "Great afternoon refresher with low caffeine"],
    usage: "Steep in boiling water for 4 minutes. Enjoy hot or iced.",
    origin: "Coorg Estate Slopes, Somwarpet, North Kodagu",
    stock: 25,
    badge: "New Flavor",
    reviews: []
  },
  {
    id: "teas-rose",
    name: "Coorg Rose Tea",
    price: 280,
    oldPrice: null,
    rating: 4.8,
    ratingCount: 21,
    category: "Herbal Teas",
    image: "images/uploads/coorg rose tea.jpeg",
    images: ["images/uploads/coorg rose tea.jpeg"],
    description: "A soothing and aromatic blend of organic green tea leaves and dried pink rose petals. Extremely delicate, floral, and calming.",
    ingredients: ["Organic Green Tea", "Dried Rose petals"],
    benefits: ["Promotes skin glow and contains anti-inflammatory properties", "Natural rose fragrance acts as a mild stress reliever", "Very light caffeine content for evening relaxation"],
    usage: "Steep in hot (not boiling) water for 2-3 minutes. Sweeten with a dash of wild honey.",
    origin: "Coorg Estate Slopes, Somwarpet, North Kodagu",
    stock: 25,
    badge: "Floral",
    reviews: []
  },
  {
    id: "specialties-kachampuli",
    name: "Coorg Kachampuli (Garcinia Cambogia Vinegar)",
    price: 290,
    oldPrice: null,
    rating: 4.9,
    ratingCount: 30,
    category: "Coorg Specialties",
    image: "images/uploads/coorg kachampuli.jpeg",
    images: ["images/uploads/coorg kachampuli.jpeg"],
    description: "The legendary dark, thick vinegar of Coorg made from the concentrated extract of wild Garcinia gummi-gutta (Kachampuli) fruit. Essential for traditional Coorg Pandi Curry.",
    ingredients: ["Concentrated Wild Kachampuli Fruit Extract"],
    benefits: ["Authentic local souring agent for Coorg meat dishes", "Rich in Hydroxycitric Acid (HCA) to support weight management", "Promotes digestive health and blood sugar balance"],
    usage: "Add 1-2 tsp to curries (especially pork or chicken) in the final stages of cooking for a tart flavor.",
    origin: "Home-kitchen Collective, Gonikopal, Kodagu",
    stock: 20,
    badge: "Heritage Product",
    reviews: []
  }
];

const seedCoupons = [
  { code: "COORG20", type: "percent", value: 20, description: "20% off on your entire order!" },
  { code: "FREESHIP", type: "fixed", value: 50, description: "Flat ₹50 discount (equivalent to shipping fee)." },
  { code: "WELCOME10", type: "percent", value: 10, description: "10% discount for first-time buyers." }
];

const seedMockOrders = [
  {
    id: "CH-2026-9281",
    date: "2026-06-12, 10:42 AM",
    name: "Devika Ponappa",
    phone: "+91 9880054321",
    email: "devika.ponappa@example.com",
    address: "Misty Green Villa, Club Road, Madikeri, Karnataka - 571201",
    items: [
      { id: "spices-black-pepper", name: "Premium Coorg Black Pepper", price: 280, qty: 2, category: "Premium Spices" },
      { id: "honey-wild-forest", name: "Raw Wild Forest Honey", price: 380, qty: 1, category: "Forest Honey" }
    ],
    subtotal: 940,
    discount: 188,
    shipping: 0,
    total: 752,
    paymentMethod: "UPI",
    status: "Paid",
    trackingId: "CHTRK9928182",
    couponCode: "COORG20"
  },
  {
    id: "CH-2026-4402",
    date: "2026-06-15, 03:15 PM",
    name: "Madan Somanna",
    phone: "+91 9448077218",
    email: "somanna.madan@example.com",
    address: "Somwarpet Coffee Estate, Somwarpet, Kodagu - 571236",
    items: [
      { id: "coffee-estate-blend", name: "Coorg Plantation Arabica Roast", price: 360, qty: 3, category: "Coffee Collection" },
      { id: "specialties-bamboo-pickle", name: "Traditional Coorg Bamboo Shoot Pickle", price: 220, qty: 1, category: "Coorg Specialties" }
    ],
    subtotal: 1300,
    discount: 0,
    shipping: 0,
    total: 1300,
    paymentMethod: "CARD",
    status: "Shipped",
    trackingId: "CHTRK4402910"
  },
  {
    id: "CH-2026-1930",
    date: "2026-06-17, 09:30 AM",
    name: "Kavitha K.",
    phone: "+91 8870199210",
    email: "kavitha.k@example.com",
    address: "7th Block, Jayanagar, Bangalore, Karnataka - 560041",
    items: [
      { id: "wellness-wild-turmeric", name: "Wild Turmeric (Kasturi Manjal)", price: 190, qty: 1, category: "Wellness Products" }
    ],
    subtotal: 190,
    discount: 0,
    shipping: 50,
    total: 240,
    paymentMethod: "COD",
    status: "Pending COD",
    trackingId: "CHTRK1930219"
  }
];

// Initialize database connection and schemas
async function initDatabase() {
  let host = process.env.DB_HOST || '127.0.0.1';
  let port = parseInt(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'u279206464_coorgharvest';
  const password = process.env.DB_PASSWORD || 'Coorgharvest4%';
  const database = process.env.DB_NAME || 'u279206464_coorgharvest';

  try {
    // Attempt SSH Tunneling if enabled
    if (process.env.SSH_TUNNEL_ENABLED === 'true') {
      const tunnelPort = await setupSshTunnel();
      if (tunnelPort) {
        host = '127.0.0.1';
        port = tunnelPort;
      }
    }
  } catch (tunnelError) {
    console.error('⚠️ SSH Tunneling failed, attempting direct connection fallback...');
    console.error(tunnelError.message);
  }

  console.log(`🔌 Attempting to connect to MySQL database at ${host}:${port}...`);

  try {
    db = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connectivity
    const connection = await db.getConnection();
    connection.release();
    dbConnected = true;
    console.log('✅ Database connected successfully!');

    // Create Tables if not exist
    await createTables();

    // Seed Data if Tables are empty
    await seedDatabase();

  } catch (error) {
    dbConnected = false;
    console.error('❌ Database initialization failed!');
    console.error(error.message);
    console.log('⚠️ Running in OFFLINE mock storage fallback mode. Database modifications will not be saved.');
    
    // Clean up tunnel if database connection failed
    closeSshTunnel();
  }
}

async function createTables() {
  console.log('🏗️ Syncing database table structures...');
  
  await db.query(`
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
      images JSON,
      description TEXT,
      ingredients JSON,
      benefits JSON,
      \`usage\` TEXT,
      origin VARCHAR(255),
      stock INT DEFAULT 0,
      badge VARCHAR(255),
      reviews JSON,
      gstRate DECIMAL(5, 2) DEFAULT 5.00,
      hsnCode VARCHAR(50) DEFAULT '0904'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      code VARCHAR(255) PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      value DECIMAL(10, 2) NOT NULL,
      description TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(255) PRIMARY KEY,
      date VARCHAR(100),
      name VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      address TEXT,
      items JSON,
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
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS purchases (
      id VARCHAR(255) PRIMARY KEY,
      invoiceNo VARCHAR(255) NOT NULL,
      vendorName VARCHAR(255) NOT NULL,
      vendorGstin VARCHAR(50),
      vendorPhone VARCHAR(50),
      date VARCHAR(100) NOT NULL,
      items JSON NOT NULL,
      subtotal DECIMAL(10, 2) NOT NULL,
      taxAmount DECIMAL(10, 2) NOT NULL,
      totalAmount DECIMAL(10, 2) NOT NULL,
      paymentStatus VARCHAR(50) DEFAULT 'Paid',
      paymentMethod VARCHAR(50) DEFAULT 'Bank Transfer',
      notes TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
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
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      text TEXT,
      time VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS settings (
      setting_key VARCHAR(255) PRIMARY KEY,
      setting_value TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Safe Column Migrations for existing deployments
  const addColumnSafe = async (table, col, def) => {
    try {
      await db.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
    } catch (err) {
      // ER_DUP_FIELDNAME / column already exists
    }
  };

  await addColumnSafe('orders', 'couponCode', 'VARCHAR(255) NULL');
  await addColumnSafe('orders', 'channel', "VARCHAR(100) DEFAULT 'Website'");
  await addColumnSafe('orders', 'costPrice', "DECIMAL(10,2) DEFAULT 0");
  await addColumnSafe('orders', 'deliveryCost', "DECIMAL(10,2) DEFAULT 0");
  await addColumnSafe('orders', 'commission', "DECIMAL(10,2) DEFAULT 0");
  await addColumnSafe('orders', 'packingCost', "DECIMAL(10,2) DEFAULT 0");
  await addColumnSafe('orders', 'netProfit', "DECIMAL(10,2) DEFAULT 0");
  await addColumnSafe('orders', 'isReturned', "TINYINT(1) DEFAULT 0");
  await addColumnSafe('orders', 'returnCost', "DECIMAL(10,2) DEFAULT 0");
  await addColumnSafe('orders', 'returnLoss', "DECIMAL(10,2) DEFAULT 0");
  await addColumnSafe('orders', 'customerGstin', "VARCHAR(50) DEFAULT NULL");
  await addColumnSafe('orders', 'gstRate', "DECIMAL(5,2) DEFAULT 5.00");
  await addColumnSafe('orders', 'taxableAmount', "DECIMAL(10,2) DEFAULT 0");
  await addColumnSafe('orders', 'cgst', "DECIMAL(10,2) DEFAULT 0");
  await addColumnSafe('orders', 'sgst', "DECIMAL(10,2) DEFAULT 0");
  await addColumnSafe('orders', 'igst', "DECIMAL(10,2) DEFAULT 0");
  await addColumnSafe('orders', 'metaData', "JSON DEFAULT NULL");

  await addColumnSafe('products', 'costPrice', "DECIMAL(10,2) DEFAULT 0");
  await addColumnSafe('products', 'gstRate', "DECIMAL(5,2) DEFAULT 5.00");
  await addColumnSafe('products', 'hsnCode', "VARCHAR(50) DEFAULT '0904'");
}

async function seedDatabase() {
  // Check if database was already seeded
  try {
    const [seededSetting] = await db.query('SELECT setting_value FROM settings WHERE setting_key = "database_seeded"');
    if (seededSetting.length > 0 && seededSetting[0].setting_value === 'true') {
      console.log('🌿 Database already initialized and seeded. Skipping seeding.');
      return;
    }
  } catch (err) {
    console.log('🌱 Settings table does not exist or database unseeded. Proceeding with seeding...');
  }

  // Seed Categories
  const [cats] = await db.query('SELECT COUNT(*) as count FROM categories');
  if (cats[0].count === 0) {
    console.log('🌱 Seeding default categories...');
    const seedCategories = [
      { id: "premium-spices", name: "Premium Spices" },
      { id: "herbal-teas", name: "Herbal Teas" },
      { id: "coffee-collection", name: "Coffee Collection" },
      { id: "forest-honey", name: "Forest Honey" },
      { id: "wellness-products", name: "Wellness Products" },
      { id: "coorg-specialties", name: "Coorg Specialties" }
    ];
    for (const c of seedCategories) {
      await db.query('INSERT INTO categories (id, name) VALUES (?, ?)', [c.id, c.name]);
    }
  }

  // Seed Products
  console.log('🌱 Checking catalog products seeding...');
  
  for (const p of seedProducts) {
    const [exists] = await db.query('SELECT id FROM products WHERE id = ?', [p.id]);
    if (exists.length === 0) {
      console.log(`🌱 Seeding new product: ${p.name}`);
      await db.query(
        'INSERT INTO products (id, name, price, oldPrice, rating, ratingCount, category, image, images, description, ingredients, benefits, `usage`, origin, stock, badge, reviews) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          p.id, p.name, p.price, p.oldPrice, p.rating, p.ratingCount, p.category, p.image,
          JSON.stringify(p.images || []), p.description, JSON.stringify(p.ingredients || []), JSON.stringify(p.benefits || []),
          p.usage, p.origin, p.stock, p.badge, JSON.stringify(p.reviews || [])
        ]
      );
    }
  }

  // Seed Coupons
  const [coups] = await db.query('SELECT COUNT(*) as count FROM coupons');
  if (coups[0].count === 0) {
    console.log('🌱 Seeding coupons...');
    for (const c of seedCoupons) {
      await db.query(
        'INSERT INTO coupons (code, type, value, description) VALUES (?, ?, ?, ?)',
        [c.code, c.type, c.value, c.description]
      );
    }
  }

  // Seed Mock Orders
  const [orders] = await db.query('SELECT COUNT(*) as count FROM orders');
  if (orders[0].count === 0) {
    console.log('🌱 Seeding mock orders...');
    for (const o of seedMockOrders) {
      await db.query(
        'INSERT INTO orders (id, date, name, phone, email, address, items, subtotal, discount, shipping, total, paymentMethod, status, trackingId, couponCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          o.id, o.date, o.name, o.phone, o.email, o.address, JSON.stringify(o.items),
          o.subtotal, o.discount, o.shipping, o.total, o.paymentMethod, o.status, o.trackingId, o.couponCode || null
        ]
      );
    }

    // Seed Initial Activity Logs
    await db.query('INSERT INTO activity_logs (text, time) VALUES (?, ?)', [
      "Admin database initialized and default catalog synced.",
      new Date().toLocaleString()
    ]);
    await db.query('INSERT INTO activity_logs (text, time) VALUES (?, ?)', [
      "Active promo codes synced: COORG20, FREESHIP, WELCOME10.",
      new Date().toLocaleString()
    ]);
    await db.query('INSERT INTO activity_logs (text, time) VALUES (?, ?)', [
      "Coorg Harvest online store seed completed successfully.",
      new Date().toLocaleString()
    ]);
  }

  // Seed Default Settings
  const [sets] = await db.query('SELECT COUNT(*) as count FROM settings');
  if (sets[0].count === 0) {
    console.log('🌱 Seeding default settings...');
    const defaultSettings = [
      { key: "delivery_charge", value: "50" },
      { key: "free_delivery_threshold", value: "500" },
      { key: "cod_enabled", value: "true" },
      { key: "google_analytics_id", value: "" },
      { key: "google_merchant_id", value: "" },
      { key: "meta_pixel_id", value: "1287784843269311" },
      { key: "meta_api_key", value: "" },
      { key: "delivery_partner_api", value: "" },
      { key: "homepage_banners", value: JSON.stringify([
        {
          title: "From the Heart of Coorg to Your Home",
          subtitle: "Premium organic spices, shade-grown Arabica coffees, and wellness products sourced directly from local farmers in the misty hills of Kodagu, Karnataka.",
          image: "images/hero_slide_1.png",
          linkText: "Shop Now",
          link: "shop.html"
        },
        {
          title: "Pure Spices. Wild by Nature.",
          subtitle: "Handpicked bold black pepper, aromatic cardamom, and wild forest cinnamon harvested using sustainable shade cultivation methods in Kodagu.",
          image: "images/hero_slide_2.png",
          linkText: "Shop Spices",
          link: "shop.html?category=Coorg%20Spices"
        },
        {
          title: "Sip the Goodness of Nature",
          subtitle: "Enjoy therapeutic wellness with our organic loose herbal teas, handpicked green tea leaves, and wild forest honey infusions.",
          image: "images/hero_slide_3.png",
          linkText: "Shop Teas",
          link: "shop.html?category=Tea%20Collections"
        }
      ])}
    ];
    for (const s of defaultSettings) {
      await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', [s.key, s.value]);
    }
  }

  // Seed Purchases if empty
  const [purchasesCount] = await db.query('SELECT COUNT(*) as count FROM purchases');
  if (purchasesCount[0].count === 0) {
    console.log('🌱 Seeding initial sample purchase invoices...');
    const seedPurchases = [
      {
        id: "PUR-2026-001",
        invoiceNo: "MV-EST-492",
        vendorName: "Misty Valley Plantation Farmers Collective",
        vendorGstin: "29AABCM1948Q1Z3",
        vendorPhone: "+91 9448011290",
        date: "2026-10-02, 11:30 AM",
        items: [
          { productId: "coffee-almond", productName: "Coorg Almond Coffee", qty: 20, unitCost: 190, gstRate: 5, taxableAmount: 3800, cgst: 95, sgst: 95, igst: 0, totalAmount: 3990 },
          { productId: "coffee-caramel", productName: "Coorg Caramel Coffee", qty: 25, unitCost: 195, gstRate: 5, taxableAmount: 4875, cgst: 121.88, sgst: 121.87, igst: 0, totalAmount: 5118.75 }
        ],
        subtotal: 8675.00,
        taxAmount: 433.75,
        totalAmount: 9108.75,
        paymentStatus: "Paid",
        paymentMethod: "Bank Transfer",
        notes: "Direct procurement of freshly roasted single-estate coffee lots."
      },
      {
        id: "PUR-2026-002",
        invoiceNo: "KOD-ORG-810",
        vendorName: "Kodagu Organic Growers Society, Madikeri",
        vendorGstin: "29AAACK3921P1ZP",
        vendorPhone: "+91 9880291044",
        date: "2026-10-08, 02:15 PM",
        items: [
          { productId: "teas-ginger", productName: "Coorg Ginger Tea", qty: 30, unitCost: 120, gstRate: 5, taxableAmount: 3600, cgst: 90, sgst: 90, igst: 0, totalAmount: 3780 },
          { productId: "teas-masala", productName: "Coorg Masala Tea", qty: 35, unitCost: 125, gstRate: 5, taxableAmount: 4375, cgst: 109.38, sgst: 109.37, igst: 0, totalAmount: 4593.75 }
        ],
        subtotal: 7975.00,
        taxAmount: 398.75,
        totalAmount: 8373.75,
        paymentStatus: "Paid",
        paymentMethod: "NEFT",
        notes: "Certified organic estate tea lots, monsoon batch."
      }
    ];
    for (const p of seedPurchases) {
      await db.query(
        `INSERT INTO purchases (id, invoiceNo, vendorName, vendorGstin, vendorPhone, date, items, subtotal, taxAmount, totalAmount, paymentStatus, paymentMethod, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.invoiceNo, p.vendorName, p.vendorGstin, p.vendorPhone, p.date, JSON.stringify(p.items), p.subtotal, p.taxAmount, p.totalAmount, p.paymentStatus, p.paymentMethod, p.notes]
      );
    }
  }

  // Seed Damaged Stock if empty
  const [damagedCount] = await db.query('SELECT COUNT(*) as count FROM damaged_stock');
  if (damagedCount[0].count === 0) {
    console.log('🌱 Seeding sample damaged stock...');
    await db.query(
      `INSERT INTO damaged_stock (id, productId, productName, qty, unitCost, totalLoss, reason, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "DMG-2026-001", "coffee-caramel", "Coorg Caramel Coffee", 2, 195.00, 390.00,
        "Transit Damage", "2026-10-10, 04:30 PM", "Glass container cracked during courier transport."
      ]
    );
  }

  // Seed sample Amazon order if none
  const [amazonOrder] = await db.query('SELECT COUNT(*) as count FROM orders WHERE channel = "Amazon"');
  if (amazonOrder[0].count === 0) {
    const sampleAmazonOrder = {
      id: "AZ-2026-7819",
      date: "2026-10-12, 11:20 AM",
      name: "Vikram Nambiar",
      phone: "+91 9741289012",
      email: "vikram.nambiar@gmail.com",
      address: "Flat 402, Green Acre Heights, Indiranagar, Bangalore, Karnataka - 560038",
      items: [
        { id: "coffee-almond", name: "Coorg Almond Coffee", price: 380, qty: 1, costPrice: 190, category: "Coffee Collection" }
      ],
      subtotal: 380,
      discount: 0,
      shipping: 70,
      total: 450,
      paymentMethod: "Amazon Pay Prepaid",
      status: "Delivered",
      trackingId: "ATS-IN-9812739",
      channel: "Amazon",
      costPrice: 190.00,
      deliveryCost: 65.00,
      commission: 57.00,
      packingCost: 15.00,
      netProfit: 123.00,
      isReturned: 0,
      returnCost: 0,
      returnLoss: 0,
      customerGstin: "",
      gstRate: 5.00,
      taxableAmount: 361.90,
      cgst: 9.05,
      sgst: 9.05,
      igst: 0,
      metaData: JSON.stringify({ amazonOrderId: "408-9821039-1829103" })
    };
    await db.query(
      `INSERT INTO orders (
        id, date, name, phone, email, address, items, subtotal, discount, shipping, total,
        paymentMethod, status, trackingId, couponCode, channel, costPrice, deliveryCost,
        commission, packingCost, netProfit, isReturned, returnCost, returnLoss,
        customerGstin, gstRate, taxableAmount, cgst, sgst, igst, metaData
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sampleAmazonOrder.id, sampleAmazonOrder.date, sampleAmazonOrder.name, sampleAmazonOrder.phone,
        sampleAmazonOrder.email, sampleAmazonOrder.address, JSON.stringify(sampleAmazonOrder.items),
        sampleAmazonOrder.subtotal, sampleAmazonOrder.discount, sampleAmazonOrder.shipping, sampleAmazonOrder.total,
        sampleAmazonOrder.paymentMethod, sampleAmazonOrder.status, sampleAmazonOrder.trackingId, null,
        sampleAmazonOrder.channel, sampleAmazonOrder.costPrice, sampleAmazonOrder.deliveryCost,
        sampleAmazonOrder.commission, sampleAmazonOrder.packingCost, sampleAmazonOrder.netProfit,
        sampleAmazonOrder.isReturned, sampleAmazonOrder.returnCost, sampleAmazonOrder.returnLoss,
        sampleAmazonOrder.customerGstin, sampleAmazonOrder.gstRate, sampleAmazonOrder.taxableAmount,
        sampleAmazonOrder.cgst, sampleAmazonOrder.sgst, sampleAmazonOrder.igst, sampleAmazonOrder.metaData
      ]
    );
  }

  // Mark database as seeded
  await db.query('INSERT INTO settings (setting_key, setting_value) VALUES ("database_seeded", "true") ON DUPLICATE KEY UPDATE setting_value = "true"');
}

// REST API Endpoints
const checkDB = (req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database Connection is Offline.' });
  }
  next();
};

// 1. GET ALL SYNC DATA
app.get('/api/db-sync', checkDB, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  try {
    const [productsRows] = await db.query('SELECT * FROM products');
    const [couponsRows] = await db.query('SELECT * FROM coupons');
    const [ordersRows] = await db.query('SELECT * FROM orders ORDER BY id DESC');
    const [logsRows] = await db.query('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 50');
    const [categoriesRows] = await db.query('SELECT * FROM categories');
    const [purchasesRows] = await db.query('SELECT * FROM purchases ORDER BY id DESC');
    const [damagedRows] = await db.query('SELECT * FROM damaged_stock ORDER BY id DESC');

    // Parse JSON columns back to arrays/objects
    const products = productsRows.map(p => ({
      ...p,
      price: parseFloat(p.price),
      costPrice: parseFloat(p.costPrice || 0),
      gstRate: parseFloat(p.gstRate || 5.00),
      hsnCode: p.hsnCode || '0904',
      oldPrice: p.oldPrice ? parseFloat(p.oldPrice) : null,
      rating: parseFloat(p.rating),
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
      ingredients: typeof p.ingredients === 'string' ? JSON.parse(p.ingredients) : p.ingredients,
      benefits: typeof p.benefits === 'string' ? JSON.parse(p.benefits) : p.benefits,
      reviews: typeof p.reviews === 'string' ? JSON.parse(p.reviews) : p.reviews
    }));

    const coupons = couponsRows.map(c => ({
      ...c,
      value: parseFloat(c.value)
    }));

    const orders = ordersRows.map(o => ({
      ...o,
      subtotal: parseFloat(o.subtotal || 0),
      discount: parseFloat(o.discount || 0),
      shipping: parseFloat(o.shipping || 0),
      total: parseFloat(o.total || 0),
      channel: o.channel || 'Website',
      costPrice: parseFloat(o.costPrice || 0),
      deliveryCost: parseFloat(o.deliveryCost || 0),
      commission: parseFloat(o.commission || 0),
      packingCost: parseFloat(o.packingCost || 0),
      netProfit: parseFloat(o.netProfit || 0),
      isReturned: !!o.isReturned,
      returnCost: parseFloat(o.returnCost || 0),
      returnLoss: parseFloat(o.returnLoss || 0),
      customerGstin: o.customerGstin || '',
      gstRate: parseFloat(o.gstRate || 5.00),
      taxableAmount: parseFloat(o.taxableAmount || 0),
      cgst: parseFloat(o.cgst || 0),
      sgst: parseFloat(o.sgst || 0),
      igst: parseFloat(o.igst || 0),
      metaData: typeof o.metaData === 'string' ? JSON.parse(o.metaData) : (o.metaData || {}),
      items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || [])
    }));

    const purchases = purchasesRows.map(p => ({
      ...p,
      subtotal: parseFloat(p.subtotal || 0),
      taxAmount: parseFloat(p.taxAmount || 0),
      totalAmount: parseFloat(p.totalAmount || 0),
      items: typeof p.items === 'string' ? JSON.parse(p.items) : (p.items || [])
    }));

    const damagedStock = damagedRows.map(d => ({
      ...d,
      qty: parseInt(d.qty || 0),
      unitCost: parseFloat(d.unitCost || 0),
      totalLoss: parseFloat(d.totalLoss || 0)
    }));

    const [settingsRows] = await db.query('SELECT * FROM settings');
    const settings = settingsRows.reduce((acc, curr) => {
      acc[curr.setting_key] = curr.setting_value;
      return acc;
    }, {});

    res.json({
      products,
      coupons,
      orders,
      logs: logsRows,
      categories: categoriesRows,
      settings,
      purchases,
      damagedStock
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. PRODUCTS ENDPOINTS
app.post('/api/products', checkDB, async (req, res) => {
  try {
    const p = req.body;
    await db.query(
      'INSERT INTO products (id, name, price, costPrice, oldPrice, rating, ratingCount, category, image, images, description, ingredients, benefits, `usage`, origin, stock, badge, reviews, gstRate, hsnCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        p.id, p.name, p.price, p.costPrice || 0, p.oldPrice, p.rating, p.ratingCount, p.category, p.image,
        JSON.stringify(p.images || []), p.description, JSON.stringify(p.ingredients || []), JSON.stringify(p.benefits || []),
        p.usage, p.origin, p.stock, p.badge, JSON.stringify(p.reviews || []), p.gstRate || 5.0, p.hsnCode || '0904'
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', checkDB, async (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;
    await db.query(
      'UPDATE products SET name=?, price=?, costPrice=?, oldPrice=?, rating=?, ratingCount=?, category=?, image=?, images=?, description=?, ingredients=?, benefits=?, `usage`=?, origin=?, stock=?, badge=?, reviews=?, gstRate=?, hsnCode=? WHERE id=?',
      [
        p.name, p.price, p.costPrice || 0, p.oldPrice, p.rating, p.ratingCount, p.category, p.image,
        JSON.stringify(p.images || []), p.description, JSON.stringify(p.ingredients || []), JSON.stringify(p.benefits || []),
        p.usage, p.origin, p.stock, p.badge, JSON.stringify(p.reviews || []), p.gstRate || 5.0, p.hsnCode || '0904', id
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', checkDB, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM products WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. COUPONS ENDPOINTS
app.post('/api/coupons', checkDB, async (req, res) => {
  try {
    const { code, type, value, description } = req.body;
    await db.query(
      'INSERT INTO coupons (code, type, value, description) VALUES (?, ?, ?, ?)',
      [code, type, value, description]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/coupons/:code', checkDB, async (req, res) => {
  try {
    const { code } = req.params;
    await db.query('DELETE FROM coupons WHERE code=?', [code]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3.5. CATEGORIES ENDPOINTS
app.post('/api/categories', checkDB, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const id = name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
    await db.query('INSERT INTO categories (id, name) VALUES (?, ?)', [id, name]);
    res.json({ success: true, category: { id, name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', checkDB, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    // Get old category name to update products
    const [oldCat] = await connection.query('SELECT name FROM categories WHERE id = ?', [id]);
    if (oldCat.length > 0) {
      const oldName = oldCat[0].name;
      // Update products in this category
      await connection.query('UPDATE products SET category = ? WHERE category = ?', [name, oldName]);
    }

    // Update category
    await connection.query('UPDATE categories SET name = ? WHERE id = ?', [name, id]);

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/categories/:id', checkDB, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    // Get category name
    const [cat] = await connection.query('SELECT name FROM categories WHERE id = ?', [id]);
    if (cat.length > 0) {
      const catName = cat[0].name;
      // Set products to Uncategorized
      await connection.query('UPDATE products SET category = "Uncategorized" WHERE category = ?', [catName]);
    }

    // Delete category
    await connection.query('DELETE FROM categories WHERE id = ?', [id]);

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 4. ORDERS ENDPOINTS
app.post('/api/orders', checkDB, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const o = req.body;

    // Save order
    await connection.query(
      `INSERT INTO orders (
        id, date, name, phone, email, address, items, subtotal, discount, shipping, total,
        paymentMethod, status, trackingId, couponCode, channel, costPrice, deliveryCost,
        commission, packingCost, netProfit, isReturned, returnCost, returnLoss,
        customerGstin, gstRate, taxableAmount, cgst, sgst, igst, metaData
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        o.id, o.date, o.name, o.phone, o.email || '', o.address, JSON.stringify(o.items || []),
        o.subtotal || 0, o.discount || 0, o.shipping || 0, o.total || 0,
        o.paymentMethod || 'UPI', o.status || 'Paid', o.trackingId || '', o.couponCode || null,
        o.channel || 'Website', o.costPrice || 0, o.deliveryCost || 0,
        o.commission || 0, o.packingCost || 0, o.netProfit || 0,
        o.isReturned ? 1 : 0, o.returnCost || 0, o.returnLoss || 0,
        o.customerGstin || null, o.gstRate || 5.0, o.taxableAmount || 0,
        o.cgst || 0, o.sgst || 0, o.igst || 0,
        JSON.stringify(o.metaData || {})
      ]
    );

    // Update product stock counts
    for (const item of (o.items || [])) {
      await connection.query(
        'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
        [item.qty || 1, item.id]
      );
    }

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.put('/api/orders/:id', checkDB, async (req, res) => {
  try {
    const { id } = req.params;
    const o = req.body;
    await db.query(
      `UPDATE orders SET 
        name=?, phone=?, email=?, address=?, subtotal=?, discount=?, shipping=?, total=?,
        paymentMethod=?, status=?, trackingId=?, channel=?, costPrice=?, deliveryCost=?,
        commission=?, packingCost=?, netProfit=?, customerGstin=?, gstRate=?, taxableAmount=?,
        cgst=?, sgst=?, igst=?
       WHERE id=?`,
      [
        o.name, o.phone, o.email || '', o.address, o.subtotal || 0, o.discount || 0, o.shipping || 0, o.total || 0,
        o.paymentMethod || 'UPI', o.status, o.trackingId || '', o.channel || 'Website',
        o.costPrice || 0, o.deliveryCost || 0, o.commission || 0, o.packingCost || 0, o.netProfit || 0,
        o.customerGstin || null, o.gstRate || 5.0, o.taxableAmount || 0, o.cgst || 0, o.sgst || 0, o.igst || 0, id
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id/return', checkDB, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { returnCost, returnLoss, restockItems, returnReason, notes } = req.body;

    await connection.query(
      `UPDATE orders SET isReturned = 1, status = 'Returned', returnCost = ?, returnLoss = ?, 
       netProfit = netProfit - ?, metaData = JSON_SET(COALESCE(metaData, '{}'), '$.returnReason', ?, '$.returnNotes', ?) 
       WHERE id = ?`,
      [returnCost || 0, returnLoss || 0, returnLoss || 0, returnReason || 'Customer Return', notes || '', id]
    );

    // If items were restocked (good condition), increment stock back
    if (restockItems && Array.isArray(restockItems)) {
      for (const item of restockItems) {
        await connection.query(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [item.qty || 1, item.id]
        );
      }
    }

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/orders/:id', checkDB, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM orders WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id/status', checkDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await db.query('UPDATE orders SET status=? WHERE id=?', [status, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id/tracking', checkDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingId } = req.body;
    await db.query('UPDATE orders SET trackingId=? WHERE id=?', [trackingId, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4.1. PURCHASES ENDPOINTS (CRM / INWARD STOCK)
app.get('/api/purchases', checkDB, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM purchases ORDER BY id DESC');
    const purchases = rows.map(p => ({
      ...p,
      subtotal: parseFloat(p.subtotal || 0),
      taxAmount: parseFloat(p.taxAmount || 0),
      totalAmount: parseFloat(p.totalAmount || 0),
      items: typeof p.items === 'string' ? JSON.parse(p.items) : (p.items || [])
    }));
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchases', checkDB, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const p = req.body;

    await connection.query(
      `INSERT INTO purchases (id, invoiceNo, vendorName, vendorGstin, vendorPhone, date, items, subtotal, taxAmount, totalAmount, paymentStatus, paymentMethod, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id, p.invoiceNo, p.vendorName, p.vendorGstin || '', p.vendorPhone || '', p.date,
        JSON.stringify(p.items || []), p.subtotal || 0, p.taxAmount || 0, p.totalAmount || 0,
        p.paymentStatus || 'Paid', p.paymentMethod || 'Bank Transfer', p.notes || ''
      ]
    );

    // Increment product stock for each inward item
    for (const item of (p.items || [])) {
      if (item.productId) {
        await connection.query(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [item.qty || 0, item.productId]
        );
        if (item.unitCost && parseFloat(item.unitCost) > 0) {
          await connection.query(
            'UPDATE products SET costPrice = ? WHERE id = ?',
            [parseFloat(item.unitCost), item.productId]
          );
        }
      }
    }

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/purchases/:id', checkDB, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM purchases WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4.2. DAMAGED STOCK ENDPOINTS
app.get('/api/damaged-stock', checkDB, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM damaged_stock ORDER BY id DESC');
    const items = rows.map(d => ({
      ...d,
      qty: parseInt(d.qty || 0),
      unitCost: parseFloat(d.unitCost || 0),
      totalLoss: parseFloat(d.totalLoss || 0)
    }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/damaged-stock', checkDB, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const d = req.body;

    await connection.query(
      `INSERT INTO damaged_stock (id, productId, productName, qty, unitCost, totalLoss, reason, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d.id, d.productId, d.productName, d.qty || 1, d.unitCost || 0,
        d.totalLoss || 0, d.reason || 'Transit Damage', d.date, d.notes || ''
      ]
    );

    // Deduct stock from products
    if (d.productId) {
      await connection.query(
        'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
        [d.qty || 1, d.productId]
      );
    }

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/damaged-stock/:id', checkDB, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM damaged_stock WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4.3. STOCK ADJUSTMENT ENDPOINT
app.put('/api/products/:id/stock', checkDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    await db.query('UPDATE products SET stock = ? WHERE id = ?', [parseInt(stock) || 0, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. ACTIVITY LOGS ENDPOINTS
app.post('/api/logs', checkDB, async (req, res) => {
  try {
    const { text, time } = req.body;
    await db.query('INSERT INTO activity_logs (text, time) VALUES (?, ?)', [text, time]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5.5. SETTINGS ENDPOINTS
app.get('/api/settings', checkDB, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  try {
    const [rows] = await db.query('SELECT * FROM settings');
    const settings = rows.reduce((acc, curr) => {
      acc[curr.setting_key] = curr.setting_value;
      return acc;
    }, {});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', checkDB, async (req, res) => {
  try {
    const settings = req.body;
    for (const key of Object.keys(settings)) {
      let val = settings[key];
      if (typeof val === 'object') {
        val = JSON.stringify(val);
      }
      await db.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, String(val), String(val)]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5.6. DYNAMIC PRODUCT XML FEEDS (FOR FACEBOOK CATALOG & GOOGLE MERCHANT)
app.get('/api/feeds/facebook', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  try {
    const [productsRows] = await db.query('SELECT * FROM products');
    
    let xml = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Coorg Harvest</title>
    <link>https://coorgharvest.com</link>
    <description>Premium organic spices, shade-grown Arabica coffees, and wellness products sourced directly from local farmers in Coorg.</description>\n`;

    for (const p of productsRows) {
      const price = parseFloat(p.price).toFixed(2);
      const availability = p.stock > 0 ? 'in stock' : 'out of stock';
      const cleanDesc = p.description ? p.description.replace(/<\/?[^>]+(>|$)/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").trim() : '';
      const cleanName = p.name ? p.name.replace(/&/g, "&amp;") : '';
      const imageUrl = p.image.startsWith('http') ? p.image : p.image.startsWith('/') ? `https://coorgharvest.com${p.image}` : `https://coorgharvest.com/${p.image}`;

      xml += `    <item>
      <g:id>${p.id}</g:id>
      <g:title>${cleanName}</g:title>
      <g:description>${cleanDesc}</g:description>
      <g:link>https://coorgharvest.com/product.html?id=${p.id}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>\n`;
      
      if (p.oldPrice) {
        xml += `      <g:price>${parseFloat(p.oldPrice).toFixed(2)} INR</g:price>\n`;
        xml += `      <g:sale_price>${price} INR</g:sale_price>\n`;
      } else {
        xml += `      <g:price>${price} INR</g:price>\n`;
      }

      xml += `      <g:brand>Coorg Harvest</g:brand>
    </item>\n`;
    }

    xml += `  </channel>
</rss>`;

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (err) {
    res.status(500).header('Content-Type', 'application/xml').send(`<error>${err.message}</error>`);
  }
});

// 6. IMAGE UPLOAD ENDPOINT
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/images/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve Dynamic HTML Pages
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-login.html'));
});

// Catch-all route to serve index.html for undefined requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Connect to Database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🌿 Coorg Harvest web server running on port ${PORT}`);
    console.log(`   Local Address: http://localhost:${PORT}`);
  });
});
