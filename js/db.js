// COORG HARVEST LOCALSTORAGE DATABASE & OPERATIONS
(function() {
  // Seed initial products if none exist
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
      image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80", // reused similar herbal image
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

  // Database helper methods
  window.CoorgDB = {
    // 1. PRODUCTS
    getProducts: function() {
      const prods = localStorage.getItem("coorg_harvest_products");
      if (!prods) {
        localStorage.setItem("coorg_harvest_products", JSON.stringify(seedProducts));
        return seedProducts;
      }
      return JSON.parse(prods);
    },
    saveProducts: function(products) {
      localStorage.setItem("coorg_harvest_products", JSON.stringify(products));
    },
    getProductById: function(id) {
      return this.getProducts().find(p => p.id === id);
    },
    addProduct: function(product) {
      const products = this.getProducts();
      products.push(product);
      this.saveProducts(products);
      this.logActivity(`Added new product: ${product.name}`);
    },
    updateProduct: function(updatedProduct) {
      let products = this.getProducts();
      products = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      this.saveProducts(products);
      this.logActivity(`Updated product: ${updatedProduct.name}`);
    },
    deleteProduct: function(id) {
      const name = this.getProductById(id)?.name || id;
      let products = this.getProducts();
      products = products.filter(p => p.id !== id);
      this.saveProducts(products);
      this.logActivity(`Deleted product: ${name}`);
    },

    // 2. CART
    getCart: function() {
      const cart = localStorage.getItem("coorg_harvest_cart");
      return cart ? JSON.parse(cart) : [];
    },
    saveCart: function(cart) {
      localStorage.setItem("coorg_harvest_cart", JSON.stringify(cart));
      // Dispatch custom cart-update event
      window.dispatchEvent(new Event("cartUpdated"));
    },
    addToCart: function(productId, qty = 1) {
      const cart = this.getCart();
      const product = this.getProductById(productId);
      if (!product) return;

      const existingIndex = cart.findIndex(item => item.id === productId);
      if (existingIndex > -1) {
        cart[existingIndex].qty += qty;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          qty: qty
        });
      }
      this.saveCart(cart);
    },
    updateCartQty: function(productId, qty) {
      let cart = this.getCart();
      const itemIndex = cart.findIndex(item => item.id === productId);
      if (itemIndex > -1) {
        cart[itemIndex].qty = qty;
        if (cart[itemIndex].qty <= 0) {
          cart.splice(itemIndex, 1);
        }
      }
      this.saveCart(cart);
    },
    removeFromCart: function(productId) {
      let cart = this.getCart();
      cart = cart.filter(item => item.id !== productId);
      this.saveCart(cart);
    },
    clearCart: function() {
      localStorage.removeItem("coorg_harvest_cart");
      localStorage.removeItem("coorg_applied_coupon");
      window.dispatchEvent(new Event("cartUpdated"));
    },
    
    // 3. COUPONS
    getCoupons: function() {
      const coupons = localStorage.getItem("coorg_harvest_coupons");
      if (!coupons) {
        localStorage.setItem("coorg_harvest_coupons", JSON.stringify(seedCoupons));
        return seedCoupons;
      }
      return JSON.parse(coupons);
    },
    saveCoupons: function(coupons) {
      localStorage.setItem("coorg_harvest_coupons", JSON.stringify(coupons));
    },
    validateCoupon: function(code) {
      const coupons = this.getCoupons();
      return coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    },
    addCoupon: function(coupon) {
      const coupons = this.getCoupons();
      coupons.push(coupon);
      this.saveCoupons(coupons);
      this.logActivity(`Created coupon code: ${coupon.code}`);
    },
    deleteCoupon: function(code) {
      let coupons = this.getCoupons();
      coupons = coupons.filter(c => c.code !== code);
      this.saveCoupons(coupons);
      this.logActivity(`Deleted coupon code: ${code}`);
    },

    // 4. ORDERS
    getOrders: function() {
      const orders = localStorage.getItem("coorg_harvest_orders");
      return orders ? JSON.parse(orders) : [];
    },
    saveOrders: function(orders) {
      localStorage.setItem("coorg_harvest_orders", JSON.stringify(orders));
    },
    getOrderById: function(id) {
      return this.getOrders().find(o => o.id === id);
    },
    placeOrder: function(orderDetails) {
      const orders = this.getOrders();
      
      // Update inventory stocks for ordered products
      const products = this.getProducts();
      orderDetails.items.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - item.qty);
        }
      });
      this.saveProducts(products);

      // Save order
      orders.push(orderDetails);
      this.saveOrders(orders);
      
      // Clear cart
      this.clearCart();

      // Log transaction activity
      this.logActivity(`New order placed: ${orderDetails.id} by ${orderDetails.name}`);
      return orderDetails;
    },
    updateOrderStatus: function(orderId, status) {
      let orders = this.getOrders();
      orders = orders.map(o => {
        if (o.id === orderId) {
          o.status = status;
          this.logActivity(`Order ${orderId} status changed to: ${status}`);
        }
        return o;
      });
      this.saveOrders(orders);
    },

    // 5. ACTIVITY LOGS (Admin actions logs)
    getActivityLogs: function() {
      const logs = localStorage.getItem("coorg_harvest_activity_logs");
      return logs ? JSON.parse(logs) : [];
    },
    logActivity: function(text) {
      const logs = this.getActivityLogs();
      logs.unshift({
        text: text,
        time: new Date().toLocaleString()
      });
      if (logs.length > 50) logs.pop(); // Keep last 50 activities
      localStorage.setItem("coorg_harvest_activity_logs", JSON.stringify(logs));
    }
  };

  // Seed database instantly on load
  window.CoorgDB.getProducts();
  window.CoorgDB.getCoupons();
})();
