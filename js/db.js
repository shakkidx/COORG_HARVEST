// COORG HARVEST SERVER-SYNCED DATABASE ADAPTER & CACHING LAYER
(function() {
  // Client-side cache memory
  let cache = {
    products: [],
    coupons: [],
    orders: [],
    logs: [],
    categories: [],
    settings: {}
  };

  let initPromise = null;

  window.CoorgDB = {
    // 1. DATABASE SYNCHRONIZATION INITIALIZER
    init: function() {
      if (!initPromise) {
        initPromise = fetch('/api/db-sync')
          .then(res => {
            if (!res.ok) throw new Error("Server sync error or database offline");
            return res.json();
          })
          .then(data => {
            cache.products = data.products || [];
            cache.coupons = data.coupons || [];
            cache.orders = data.orders || [];
            cache.logs = data.logs || [];
            cache.categories = data.categories || [];
            cache.settings = data.settings || {};
            
            // Sync fallback storage
            localStorage.setItem("coorg_harvest_products", JSON.stringify(cache.products));
            localStorage.setItem("coorg_harvest_coupons", JSON.stringify(cache.coupons));
            localStorage.setItem("coorg_harvest_orders", JSON.stringify(cache.orders));
            localStorage.setItem("coorg_harvest_activity_logs", JSON.stringify(cache.logs));
            localStorage.setItem("coorg_harvest_categories", JSON.stringify(cache.categories));
            localStorage.setItem("coorg_harvest_settings", JSON.stringify(cache.settings));
            
            console.log("🌿 CoorgDB: Sync with Hostinger MySQL Database completed successfully.");
          })
          .catch(err => {
            console.warn("⚠️ CoorgDB: Sync failed. Falling back to LocalStorage.", err.message);
            // Load from LocalStorage fallback or default seed
            let localProducts = null;
            try {
              localProducts = JSON.parse(localStorage.getItem("coorg_harvest_products"));
            } catch (e) {}

            // If local products contain old spices or cardamom, force reset the cache
            if (localProducts && localProducts.some(p => p.id === 'spices-black-pepper')) {
              console.log("🧹 CoorgDB: Legacy products detected in browser cache. Purging cache...");
              localProducts = null;
              localStorage.removeItem("coorg_harvest_products");
              localStorage.removeItem("coorg_harvest_categories");
            }

            cache.products = localProducts || getFallbackProducts();
            cache.coupons = JSON.parse(localStorage.getItem("coorg_harvest_coupons")) || [
              { code: "COORG20", type: "percent", value: 20, description: "20% off on your entire order!" },
              { code: "FREESHIP", type: "fixed", value: 50, description: "Flat ₹50 discount (equivalent to shipping fee)." },
              { code: "WELCOME10", type: "percent", value: 10, description: "10% discount for first-time buyers." }
            ];
            cache.orders = JSON.parse(localStorage.getItem("coorg_harvest_orders")) || [];
            cache.logs = JSON.parse(localStorage.getItem("coorg_harvest_activity_logs")) || [];
            cache.categories = JSON.parse(localStorage.getItem("coorg_harvest_categories")) || [
              { id: "coorg-spices", name: "Coorg Spices" },
              { id: "tea-collection", name: "Tea Collection" },
              { id: "coffee-collection", name: "Coffee Collection" },
              { id: "forest-honey", name: "Forest Honey" },
              { id: "wellness-products", name: "Wellness Products" },
              { id: "coorg-specialties", name: "Coorg Specialties" }
            ];
            cache.settings = JSON.parse(localStorage.getItem("coorg_harvest_settings")) || {
              delivery_charge: "50",
              cod_enabled: "true",
              google_analytics_id: "",
              google_merchant_id: "",
              meta_pixel_id: "",
              meta_api_key: "",
              delivery_partner_api: "",
              homepage_banners: "[]"
            };

            // Seed fallback storage so subsequent visits are fast and fully loaded
            localStorage.setItem("coorg_harvest_products", JSON.stringify(cache.products));
            localStorage.setItem("coorg_harvest_coupons", JSON.stringify(cache.coupons));
            localStorage.setItem("coorg_harvest_orders", JSON.stringify(cache.orders));
            localStorage.setItem("coorg_harvest_activity_logs", JSON.stringify(cache.logs));
            localStorage.setItem("coorg_harvest_categories", JSON.stringify(cache.categories));
            localStorage.setItem("coorg_harvest_settings", JSON.stringify(cache.settings));
          });
      }
      return initPromise;
    },

    // 2. PRODUCTS CRUD
    getProducts: function() {
      return cache.products;
    },
    getProductById: function(id) {
      return cache.products.find(p => p.id === id);
    },
    addProduct: async function(product) {
      cache.products.push(product);
      localStorage.setItem("coorg_harvest_products", JSON.stringify(cache.products));
      await this.logActivity(`Added new product: ${product.name}`);
      
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
      } catch (err) {
        console.error("Error saving product to server database:", err);
      }
    },
    updateProduct: async function(updatedProduct) {
      cache.products = cache.products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      localStorage.setItem("coorg_harvest_products", JSON.stringify(cache.products));
      await this.logActivity(`Updated product: ${updatedProduct.name}`);
      
      try {
        await fetch(`/api/products/${updatedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProduct)
        });
      } catch (err) {
        console.error("Error updating product on server database:", err);
      }
    },
    deleteProduct: async function(id) {
      const name = this.getProductById(id)?.name || id;
      cache.products = cache.products.filter(p => p.id !== id);
      localStorage.setItem("coorg_harvest_products", JSON.stringify(cache.products));
      await this.logActivity(`Deleted product: ${name}`);
      
      try {
        await fetch(`/api/products/${id}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error("Error deleting product from server database:", err);
      }
    },

    // 3. CART OPERATIONS (Session/Browser Specific - Stored Locally)
    getCart: function() {
      const cart = localStorage.getItem("coorg_harvest_cart");
      return cart ? JSON.parse(cart) : [];
    },
    saveCart: function(cart) {
      localStorage.setItem("coorg_harvest_cart", JSON.stringify(cart));
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

    // 4. COUPONS CRUD
    getCoupons: function() {
      return cache.coupons;
    },
    validateCoupon: function(code) {
      return cache.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    },
    addCoupon: async function(coupon) {
      cache.coupons.push(coupon);
      localStorage.setItem("coorg_harvest_coupons", JSON.stringify(cache.coupons));
      await this.logActivity(`Created coupon code: ${coupon.code}`);
      
      try {
        await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(coupon)
        });
      } catch (err) {
        console.error("Error creating coupon on server database:", err);
      }
    },
    deleteCoupon: async function(code) {
      cache.coupons = cache.coupons.filter(c => c.code !== code);
      localStorage.setItem("coorg_harvest_coupons", JSON.stringify(cache.coupons));
      await this.logActivity(`Deleted coupon code: ${code}`);
      
      try {
        await fetch(`/api/coupons/${code}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error("Error deleting coupon from server database:", err);
      }
    },

    // 5. ORDERS CRUD
    getOrders: function() {
      return cache.orders;
    },
    getOrderById: function(id) {
      return cache.orders.find(o => o.id === id);
    },
    placeOrder: async function(orderDetails) {
      // Update inventory stocks locally
      cache.products.forEach(p => {
        const item = orderDetails.items.find(i => i.id === p.id);
        if (item) {
          p.stock = Math.max(0, p.stock - item.qty);
        }
      });
      localStorage.setItem("coorg_harvest_products", JSON.stringify(cache.products));

      // Save order locally
      cache.orders.push(orderDetails);
      localStorage.setItem("coorg_harvest_orders", JSON.stringify(cache.orders));
      
      // Clear cart
      this.clearCart();

      // Log transaction
      await this.logActivity(`New order placed: ${orderDetails.id} by ${orderDetails.name}`);

      // Push to MySQL
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderDetails)
        });
      } catch (err) {
        console.error("Error processing order on server database:", err);
      }

      return orderDetails;
    },
    updateOrderStatus: async function(orderId, status) {
      cache.orders = cache.orders.map(o => {
        if (o.id === orderId) {
          o.status = status;
        }
        return o;
      });
      localStorage.setItem("coorg_harvest_orders", JSON.stringify(cache.orders));
      await this.logActivity(`Order ${orderId} status changed to: ${status}`);

      try {
        await fetch(`/api/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
      } catch (err) {
        console.error("Error updating order status on server database:", err);
      }
    },
    updateOrderTracking: async function(orderId, trackingId) {
      cache.orders = cache.orders.map(o => {
        if (o.id === orderId) {
          o.trackingId = trackingId;
        }
        return o;
      });
      localStorage.setItem("coorg_harvest_orders", JSON.stringify(cache.orders));
      await this.logActivity(`Order ${orderId} tracking number updated to: ${trackingId}`);

      try {
        await fetch(`/api/orders/${orderId}/tracking`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackingId })
        });
      } catch (err) {
        console.error("Error updating order tracking on server database:", err);
      }
    },

    // 6. ACTIVITY LOGS CRUD
    getActivityLogs: function() {
      return cache.logs;
    },
    logActivity: async function(text) {
      const logItem = {
        text: text,
        time: new Date().toLocaleString()
      };
      
      cache.logs.unshift(logItem);
      if (cache.logs.length > 50) cache.logs.pop();
      localStorage.setItem("coorg_harvest_activity_logs", JSON.stringify(cache.logs));

      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logItem)
        });
      } catch (err) {
        console.error("Error logging activity to server database:", err);
      }
    },

    // 7. CATEGORIES CRUD
    getCategories: function() {
      return cache.categories;
    },
    addCategory: async function(categoryName) {
      const id = categoryName.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
      const newCat = { id, name: categoryName };
      cache.categories.push(newCat);
      localStorage.setItem("coorg_harvest_categories", JSON.stringify(cache.categories));
      await this.logActivity(`Created product category: ${categoryName}`);

      try {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: categoryName })
        });
      } catch (err) {
        console.error("Error creating category on server database:", err);
      }
    },
    updateCategory: async function(id, newName) {
      // Find old name to rename products in local cache
      const cat = cache.categories.find(c => c.id === id);
      if (cat) {
        const oldName = cat.name;
        // Cascade to cache products
        cache.products = cache.products.map(p => {
          if (p.category === oldName) {
            p.category = newName;
          }
          return p;
        });
        localStorage.setItem("coorg_harvest_products", JSON.stringify(cache.products));
        
        cat.name = newName;
        localStorage.setItem("coorg_harvest_categories", JSON.stringify(cache.categories));
        await this.logActivity(`Renamed category: ${oldName} to ${newName}`);
      }

      try {
        await fetch(`/api/categories/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName })
        });
      } catch (err) {
        console.error("Error updating category on server database:", err);
      }
    },
    deleteCategory: async function(id) {
      const cat = cache.categories.find(c => c.id === id);
      if (cat) {
        const catName = cat.name;
        // Cascade: change products in this category to Uncategorized
        cache.products = cache.products.map(p => {
          if (p.category === catName) {
            p.category = "Uncategorized";
          }
          return p;
        });
        localStorage.setItem("coorg_harvest_products", JSON.stringify(cache.products));

        cache.categories = cache.categories.filter(c => c.id !== id);
        localStorage.setItem("coorg_harvest_categories", JSON.stringify(cache.categories));
        await this.logActivity(`Deleted category: ${catName}`);
      }

      try {
        await fetch(`/api/categories/${id}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error("Error deleting category from server database:", err);
      }
    },

    // 8. SETTINGS CRUD
    getSettings: function() {
      return cache.settings;
    },
    updateSettings: async function(settingsObj) {
      cache.settings = { ...cache.settings, ...settingsObj };
      localStorage.setItem("coorg_harvest_settings", JSON.stringify(cache.settings));
      await this.logActivity("Updated store settings and configurations.");
      
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settingsObj)
        });
      } catch (err) {
        console.error("Error saving settings to server database:", err);
      }
    }
  };

  // CLIENT-SIDE PRODUCT FALLBACK CATALOG DATA (20 Products)
  function getFallbackProducts() {
    return [
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
  }
})();
