const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const fs = require('fs');
const multer = require('multer');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'images', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration for Local Uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
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

// Global Database Pool variable
let db = null;
let dbConnected = false;

// Default Seed Data
const seedProducts = [
  {
    id: "spices-black-pepper",
    name: "Premium Coorg Black Pepper",
    price: 280,
    oldPrice: 320,
    rating: 4.9,
    ratingCount: 142,
    category: "Premium Spices",
    image: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=600&q=80"
    ],
    description: "Sourced directly from the multi-tier plantations of Gonikopal, Kodagu. Our black pepper is hand-sorted and sun-dried, preserving its high piperine content, intense aroma, and bold heat. Perfect for elevating standard culinary dishes.",
    ingredients: ["100% Whole Coorg Black Pepper (Piper nigrum)"],
    benefits: [
      "Rich in active antioxidants and piperine",
      "Improves digestion and gut absorption",
      "Promotes metabolic health and immunity",
      "Natural anti-inflammatory properties"
    ],
    usage: "Crush freshly over grilled dishes, soups, stir-fries, and traditional Coorg pork curry (Pandi Curry). Store in an airtight container away from direct sunlight.",
    origin: "Misty Valley Plantation, Gonikopal, South Kodagu",
    stock: 45,
    badge: "Bestseller",
    reviews: [
      { name: "Devika Ponappa", rating: 5, date: "2026-05-10", content: "The aroma is incredible! Very different from store-bought pepper. Real spice heat from Coorg plantations." },
      { name: "Rohan Mehra", rating: 4, date: "2026-06-02", content: "Superb quality, large peppercorns. Will definitely order again." }
    ]
  },
  {
    id: "spices-cardamom",
    name: "Bold Green Cardamom (8mm+)",
    price: 490,
    oldPrice: 550,
    rating: 4.8,
    ratingCount: 96,
    category: "Premium Spices",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80"
    ],
    description: "Our green cardamom pods are handpicked at optimal ripeness from the shady hill tracks of Coorg. Sized 8mm and above, these premium bold pods contain full, oily black seeds brimming with intense camphoraceous sweetness.",
    ingredients: ["100% Green Cardamom Pods (Elettaria cardamomum)"],
    benefits: [
      "Aids respiratory health and freshens breath",
      "Acts as a powerful natural digestive stimulant",
      "Regulates blood pressure levels",
      "Rich in essential active botanical compounds"
    ],
    usage: "Lightly crush pods to release seeds for masala teas, rice pilaf, traditional desserts, and curries. Use pods whole or ground.",
    origin: "Kutta Ridge Estates, Kodagu-Kerala Border Hills",
    stock: 32,
    badge: "Organic",
    reviews: [
      { name: "Suresh Chengappa", rating: 5, date: "2026-04-18", content: "Giant pods with lots of black seeds. Highly aromatic. Beautifully packaged." }
    ]
  },
  {
    id: "teas-hibiscus",
    name: "Western Ghats Wild Hibiscus Tea",
    price: 240,
    oldPrice: 299,
    rating: 4.7,
    ratingCount: 112,
    category: "Herbal Teas",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80"
    ],
    description: "A ruby-red wellness infusion crafted from sun-dried wild hibiscus calyces sourced from organic forest margins in Kodagu. Naturally caffeine-free with a tart, refreshing flavor reminiscent of cranberries.",
    ingredients: ["Sun-dried Hibiscus Calyces", "Lemon Peel Extract", "Mint Leaves"],
    benefits: [
      "High concentration of Vitamin C and antioxidants",
      "Assists in maintaining healthy blood pressure",
      "Supports kidney function and hydration",
      "Naturally caffeine-free calming blend"
    ],
    usage: "Steep 1 tsp of tea in boiling water for 5 minutes. Strain and sweeten with Forest Honey. Enjoy hot or iced with lime.",
    origin: "Devarakadu Sacred Forest Margins, Virajpet, Kodagu",
    stock: 60,
    badge: "Popular",
    reviews: [
      { name: "Anjali Gupta", rating: 5, date: "2026-05-20", content: "Absolutely gorgeous red color. It tastes sour and sweet. Add honey and it is a perfect evening detox drink!" }
    ]
  },
  {
    id: "coffee-estate-blend",
    name: "Coorg Plantation Arabica Roast",
    price: 360,
    oldPrice: 420,
    rating: 4.9,
    ratingCount: 184,
    category: "Coffee Collection",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80"
    ],
    description: "100% shade-grown Arabica coffee beans from single-estate plantations nestled 3,500 feet high in Somwarpet, Coorg. Medium roasted to highlight rich chocolate undertones, mild citrus acidity, and a smooth, clean finish.",
    ingredients: ["100% shade-grown roasted Arabica coffee beans (Ground)"],
    benefits: [
      "Rich in natural antioxidants",
      "Improves physical performance and focus",
      "Slow-released clean energy without crashes",
      "100% ethically sourced from shade-grown estates"
    ],
    usage: "Ideal for French press, South Indian filter coffee, or drip brewing. Use 2 tbsp of coffee per cup of hot water.",
    origin: "Somwarpet Highlands Plantation (Altitude: 3500 ft)",
    stock: 25,
    badge: "Bestseller",
    reviews: [
      { name: "Madan Somanna", rating: 5, date: "2026-06-01", content: "Perfect medium roast. The chocolatey notes are distinct. Best morning cup!" }
    ]
  },
  {
    id: "honey-wild-forest",
    name: "Raw Wild Forest Honey",
    price: 380,
    oldPrice: 450,
    rating: 4.9,
    ratingCount: 210,
    category: "Forest Honey",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=600&q=80"
    ],
    description: "Harvested by indigenous forest communities from wild hives in the dense deciduous forests of Kodagu. Unfiltered, unpasteurized, and 100% raw. Retains natural pollen and enzymes with a complex multi-floral taste.",
    ingredients: ["100% Pure Raw Wild Forest Honey"],
    benefits: [
      "Natural antibacterial and antiviral healer",
      "Effective throat soothing syrup",
      "Replaces refined sugar with clean fructose/glucose",
      "Contains active forest pollens and antioxidants"
    ],
    usage: "Consume directly, drizzle on pancakes, mix in warm lemon water, or stir into herbal teas. Note: Honey may naturally crystallize.",
    origin: "Pushpagiri Wild Forest Foothills, Coorg",
    stock: 18,
    badge: "Limited Sourcing",
    reviews: [
      { name: "Priya Rao", rating: 5, date: "2026-05-15", content: "This honey is dense, floral and tastes amazing. It's totally different from commercial honeys that are just sugar syrup. True wilderness in a jar!" }
    ]
  },
  {
    id: "wellness-wild-turmeric",
    name: "Wild Turmeric (Kasturi Manjal)",
    price: 190,
    oldPrice: 220,
    rating: 4.6,
    ratingCount: 74,
    category: "Wellness Products",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80",
    images: ["https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80"],
    description: "Pure heirloom Kasturi Manjal powder ground from roots harvested in traditional tribal pockets of South Coorg. Renowned in Ayurvedic tradition for skincare, glowing complexion, and high anti-inflammatory curcumin counts.",
    ingredients: ["100% Pure Kasturi Manjal Roots (Curcuma aromatica)"],
    benefits: [
      "Improves skin complexion and combats acne",
      "Reduces dark spots and blemishes",
      "Powerful natural antiseptic and healing agent",
      "Sourced sustainably from traditional forest farms"
    ],
    usage: "For skincare: Mix 1 tsp turmeric powder with milk or rosewater to make a paste. Apply for 15 mins, then rinse. (Does not stain skin yellow).",
    origin: "Nagarhole Forest Margins, South Kodagu",
    stock: 50,
    badge: "Pure Wellness",
    reviews: [
      { name: "Kavitha K.", rating: 4, date: "2026-05-29", content: "Great face pack component. Feels pure and has a pleasant organic smell." }
    ]
  },
  {
    id: "specialties-bamboo-pickle",
    name: "Traditional Coorg Bamboo Shoot Pickle",
    price: 220,
    oldPrice: 260,
    rating: 4.8,
    ratingCount: 88,
    category: "Coorg Specialties",
    image: "https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=600&q=80",
    images: ["https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=600&q=80"],
    description: "Crafted during the monsoon harvest of tender forest bamboo shoots (Baimbale). Pickle prepared using traditional Coorg recipes with mustard seeds, garlic, red chili, spices, and cold-pressed oil. Tastes tart, spicy, and savory.",
    ingredients: ["Tender Bamboo Shoots", "Mustard", "Chili Powder", "Garlic", "Salt", "Cold Pressed Oil"],
    benefits: [
      "Rich in dietary fibers and minerals",
      "Low in fat and calories",
      "Traditional probiotic gut booster",
      "Preserved naturally without chemical additives"
    ],
    usage: "Serve as a side dish with Akki Roti (Rice flatbread), Ghee Rice, or traditional steamed rice cakes (Kambula/Kadambuttu).",
    origin: "Home-kitchen Collective, Gonikopal, Kodagu",
    stock: 15,
    badge: "Traditional Recipe",
    reviews: [
      { name: "Subbaiah B.", rating: 5, date: "2026-06-11", content: "Authentic Baimbale pickle taste. Tastes exactly like my grandmother's recipe. Love it!" }
    ]
  },
  {
    id: "spices-birds-eye-chili",
    name: "Wild Coorg Bird's Eye Chili (Gandhari)",
    price: 260,
    oldPrice: 300,
    rating: 4.7,
    ratingCount: 52,
    category: "Premium Spices",
    image: "https://images.unsplash.com/photo-1588252303782-cb80119cb665?auto=format&fit=crop&w=600&q=80",
    images: ["https://images.unsplash.com/photo-1588252303782-cb80119cb665?auto=format&fit=crop&w=600&q=80"],
    description: "Locally known as 'Gandhari' chilies, these tiny fiery pods grow semi-wild in coffee plantations under direct shading. They are dried meticulously to preserve their extreme heat, punchy citrus nodes, and medicinal properties.",
    ingredients: ["100% Whole Sun-Dried Bird's Eye Chili (Capsicum frutescens)"],
    benefits: [
      "Extremely high metabolism booster",
      "Assists pain relief and circulatory flow",
      "Aids respiratory clearout and head congestion",
      "Natural organic pesticide qualities"
    ],
    usage: "Use in hot pickles, chutneys, vinegars, and meat stews. Use sparingly due to high SHU rating (heat levels).",
    origin: "Coorg Estate Slopes, Somwarpet, North Kodagu",
    stock: 40,
    badge: "Rare Find",
    reviews: [
      { name: "Nikhil P.", rating: 5, date: "2026-06-08", content: "Very fiery! Just two chilies are enough to make a curry spicy. Excellent dry preservation." }
    ]
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
    trackingId: "CHTRK9928182"
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
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'u279206464_coorgharvest';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'u279206464_coorgharvest';
  const port = parseInt(process.env.DB_PORT || '3306');

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
  }
}

async function createTables() {
  console.log('🏗️ Syncing database table structures...');
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
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
      reviews JSON
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
      trackingId VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      text TEXT,
      time VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function seedDatabase() {
  // Seed Products
  const [prods] = await db.query('SELECT COUNT(*) as count FROM products');
  if (prods[0].count === 0) {
    console.log('🌱 Seeding products...');
    for (const p of seedProducts) {
      await db.query(
        'INSERT INTO products (id, name, price, oldPrice, rating, ratingCount, category, image, images, description, ingredients, benefits, `usage`, origin, stock, badge, reviews) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          p.id, p.name, p.price, p.oldPrice, p.rating, p.ratingCount, p.category, p.image,
          JSON.stringify(p.images), p.description, JSON.stringify(p.ingredients), JSON.stringify(p.benefits),
          p.usage, p.origin, p.stock, p.badge, JSON.stringify(p.reviews)
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
        'INSERT INTO orders (id, date, name, phone, email, address, items, subtotal, discount, shipping, total, paymentMethod, status, trackingId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          o.id, o.date, o.name, o.phone, o.email, o.address, JSON.stringify(o.items),
          o.subtotal, o.discount, o.shipping, o.total, o.paymentMethod, o.status, o.trackingId
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
  try {
    const [productsRows] = await db.query('SELECT * FROM products');
    const [couponsRows] = await db.query('SELECT * FROM coupons');
    const [ordersRows] = await db.query('SELECT * FROM orders');
    const [logsRows] = await db.query('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 50');

    // Parse JSON columns back to arrays/objects
    const products = productsRows.map(p => ({
      ...p,
      price: parseFloat(p.price),
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
      subtotal: parseFloat(o.subtotal),
      discount: parseFloat(o.discount),
      shipping: parseFloat(o.shipping),
      total: parseFloat(o.total),
      items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
    }));

    res.json({ products, coupons, orders, logs: logsRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. PRODUCTS ENDPOINTS
app.post('/api/products', checkDB, async (req, res) => {
  try {
    const p = req.body;
    await db.query(
      'INSERT INTO products (id, name, price, oldPrice, rating, ratingCount, category, image, images, description, ingredients, benefits, `usage`, origin, stock, badge, reviews) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        p.id, p.name, p.price, p.oldPrice, p.rating, p.ratingCount, p.category, p.image,
        JSON.stringify(p.images || []), p.description, JSON.stringify(p.ingredients || []), JSON.stringify(p.benefits || []),
        p.usage, p.origin, p.stock, p.badge, JSON.stringify(p.reviews || [])
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
      'UPDATE products SET name=?, price=?, oldPrice=?, rating=?, ratingCount=?, category=?, image=?, images=?, description=?, ingredients=?, benefits=?, `usage`=?, origin=?, stock=?, badge=?, reviews=? WHERE id=?',
      [
        p.name, p.price, p.oldPrice, p.rating, p.ratingCount, p.category, p.image,
        JSON.stringify(p.images || []), p.description, JSON.stringify(p.ingredients || []), JSON.stringify(p.benefits || []),
        p.usage, p.origin, p.stock, p.badge, JSON.stringify(p.reviews || []), id
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

// 4. ORDERS ENDPOINTS
app.post('/api/orders', checkDB, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const o = req.body;

    // Save order
    await connection.query(
      'INSERT INTO orders (id, date, name, phone, email, address, items, subtotal, discount, shipping, total, paymentMethod, status, trackingId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        o.id, o.date, o.name, o.phone, o.email, o.address, JSON.stringify(o.items),
        o.subtotal, o.discount, o.shipping, o.total, o.paymentMethod, o.status, o.trackingId
      ]
    );

    // Update product stock counts
    for (const item of o.items) {
      await connection.query(
        'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
        [item.qty, item.id]
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
