// COORG HARVEST SERVER-SYNCED DATABASE ADAPTER & CACHING LAYER
(function() {
  // Client-side cache memory
  let cache = {
    products: [],
    coupons: [],
    orders: [],
    logs: [],
    categories: [],
    settings: {},
    purchases: [],
    damagedStock: []
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
            cache.purchases = data.purchases || [];
            cache.damagedStock = data.damagedStock || [];
            
            // Sync fallback storage
            localStorage.setItem("coorg_harvest_products", JSON.stringify(cache.products));
            localStorage.setItem("coorg_harvest_coupons", JSON.stringify(cache.coupons));
            localStorage.setItem("coorg_harvest_orders", JSON.stringify(cache.orders));
            localStorage.setItem("coorg_harvest_activity_logs", JSON.stringify(cache.logs));
            localStorage.setItem("coorg_harvest_categories", JSON.stringify(cache.categories));
            localStorage.setItem("coorg_harvest_settings", JSON.stringify(cache.settings));
            localStorage.setItem("coorg_harvest_purchases", JSON.stringify(cache.purchases));
            localStorage.setItem("coorg_harvest_damaged_stock", JSON.stringify(cache.damagedStock));
            
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
            cache.products.forEach(p => {
              if (p.gstType === undefined || !p.gstType) p.gstType = "inclusive";
              if (p.gstRate === undefined || p.gstRate === null) p.gstRate = 5;
              if (!p.hsnCode) {
                const cat = (p.category || '').toLowerCase();
                if (cat.includes('coffee')) p.hsnCode = "0901";
                else if (cat.includes('tea')) p.hsnCode = "0902";
                else if (cat.includes('honey')) p.hsnCode = "0409";
                else if (cat.includes('spice')) p.hsnCode = "0908";
                else p.hsnCode = "0910";
              }
              if (p.costPrice === undefined || p.costPrice === null) {
                p.costPrice = Math.round((p.price || 100) * 0.55);
              }
            });
            cache.coupons = JSON.parse(localStorage.getItem("coorg_harvest_coupons")) || [
              { code: "COORG20", type: "percent", value: 20, description: "20% off on your entire order!" },
              { code: "FREESHIP", type: "fixed", value: 50, description: "Flat ₹50 discount (equivalent to shipping fee)." },
              { code: "WELCOME10", type: "percent", value: 10, description: "10% discount for first-time buyers." }
            ];
            const savedOrders = JSON.parse(localStorage.getItem("coorg_harvest_orders") || "[]");
            cache.orders = savedOrders.length > 0 ? savedOrders : getFallbackOrders();
            cache.logs = JSON.parse(localStorage.getItem("coorg_harvest_activity_logs")) || [];
            cache.categories = JSON.parse(localStorage.getItem("coorg_harvest_categories")) || [
              { id: "coorg-spices", name: "Coorg Spices" },
              { id: "tea-collection", name: "Tea Collection" },
              { id: "coffee-collection", name: "Coffee Collection" },
              { id: "forest-honey", name: "Forest Honey" },
              { id: "wellness-products", name: "Wellness Products" },
              { id: "coorg-specialties", name: "Coorg Specialties" }
            ];
            const defaultSettings = {
              company_name: "Coorg Harvest",
              company_proprietor: "FAABID FAIZAL P M",
              company_gstin: "29IJLPM3578P1ZX",
              company_state_code: "29",
              company_fssai: "21226110000154",
              company_default_gst: "5.0",
              company_address: "Bypass Road, Gonikopal, Kodagu - 571213, Karnataka",
              company_phone: "+91 9880077218",
              company_email: "info@coorgharvest.com",
              delivery_charge: "50",
              free_delivery_threshold: "500",
              cod_enabled: "true",
              google_analytics_id: "",
              google_merchant_id: "",
              meta_pixel_id: "",
              meta_api_key: "",
              delivery_partner_api: "",
              homepage_banners: "[]"
            };
            const storedSettings = JSON.parse(localStorage.getItem("coorg_harvest_settings") || "{}");
            cache.settings = { ...defaultSettings, ...storedSettings };
            // Ensure official brand, proprietor, GSTIN, and FSSAI are clean
            if (!cache.settings.company_gstin || cache.settings.company_gstin.includes("AAAC")) {
              cache.settings.company_gstin = "29IJLPM3578P1ZX";
            }
            if (!cache.settings.company_name || cache.settings.company_name.includes("Agro")) {
              cache.settings.company_name = "Coorg Harvest";
            }
            if (!cache.settings.company_proprietor) {
              cache.settings.company_proprietor = "FAABID FAIZAL P M";
            }
            if (!cache.settings.company_fssai || cache.settings.company_fssai.includes("11223344")) {
              cache.settings.company_fssai = "21226110000154";
            }
            localStorage.setItem("coorg_harvest_settings", JSON.stringify(cache.settings));
            const savedPurchases = JSON.parse(localStorage.getItem("coorg_harvest_purchases") || "[]");
            cache.purchases = savedPurchases.length > 0 ? savedPurchases : getFallbackPurchases();
            const savedDamaged = JSON.parse(localStorage.getItem("coorg_harvest_damaged_stock") || "[]");
            cache.damagedStock = savedDamaged.length > 0 ? savedDamaged : getFallbackDamagedStock();

            // Seed fallback storage so subsequent visits are fast and fully loaded
            localStorage.setItem("coorg_harvest_products", JSON.stringify(cache.products));
            localStorage.setItem("coorg_harvest_coupons", JSON.stringify(cache.coupons));
            localStorage.setItem("coorg_harvest_orders", JSON.stringify(cache.orders));
            localStorage.setItem("coorg_harvest_activity_logs", JSON.stringify(cache.logs));
            localStorage.setItem("coorg_harvest_categories", JSON.stringify(cache.categories));
            localStorage.setItem("coorg_harvest_settings", JSON.stringify(cache.settings));
            localStorage.setItem("coorg_harvest_purchases", JSON.stringify(cache.purchases));
            localStorage.setItem("coorg_harvest_damaged_stock", JSON.stringify(cache.damagedStock));
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
    deleteOrder: async function(id) {
      cache.orders = cache.orders.filter(o => o.id !== id);
      localStorage.setItem("coorg_harvest_orders", JSON.stringify(cache.orders));
      await this.logActivity(`Deleted order: ${id}`);

      try {
        await fetch(`/api/orders/${id}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error("Error deleting order from server database:", err);
      }
    },
    updateOrder: async function(id, updatedOrder) {
      cache.orders = cache.orders.map(o => o.id === id ? { ...o, ...updatedOrder } : o);
      localStorage.setItem("coorg_harvest_orders", JSON.stringify(cache.orders));
      await this.logActivity(`Updated order details: ${id}`);

      try {
        await fetch(`/api/orders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedOrder)
        });
      } catch (err) {
        console.error("Error updating order on server database:", err);
      }
    },
    processOrderReturn: async function(orderId, returnData) {
      const order = this.getOrderById(orderId);
      if (!order) return;

      order.isReturned = true;
      order.status = "Returned";
      order.returnCost = parseFloat(returnData.returnCost || 0);
      order.returnLoss = parseFloat(returnData.returnLoss || 0);
      order.netProfit = (order.netProfit || 0) - order.returnLoss;
      order.metaData = {
        ...(order.metaData || {}),
        returnReason: returnData.returnReason || "Customer Return",
        returnNotes: returnData.notes || "",
        returnDate: returnData.date || new Date().toLocaleString()
      };

      // Restock good items if specified
      if (returnData.restockItems && Array.isArray(returnData.restockItems)) {
        returnData.restockItems.forEach(item => {
          const product = cache.products.find(p => p.id === item.id);
          if (product) {
            product.stock = (product.stock || 0) + item.qty;
          }
        });
        localStorage.setItem("coorg_harvest_products", JSON.stringify(cache.products));
      }

      // Add to damaged stock if any item was damaged
      if (returnData.damagedItems && Array.isArray(returnData.damagedItems)) {
        for (const d of returnData.damagedItems) {
          await this.addDamagedStock({
            id: `DMG-${Date.now().toString().slice(-6)}`,
            productId: d.id,
            productName: d.name,
            qty: d.qty,
            unitCost: d.costPrice || 0,
            totalLoss: (d.costPrice || 0) * d.qty,
            reason: "Customer Return Damaged",
            date: returnData.date || new Date().toLocaleString(),
            notes: `Order return ${orderId}: ${returnData.returnReason || ''}`
          });
        }
      }

      localStorage.setItem("coorg_harvest_orders", JSON.stringify(cache.orders));
      await this.logActivity(`Processed return for order: ${orderId} (Loss: ₹${order.returnLoss})`);

      try {
        await fetch(`/api/orders/${orderId}/return`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(returnData)
        });
      } catch (err) {
        console.error("Error updating return status on server database:", err);
      }
    },

    // 5.5. PURCHASES CRUD (CRM / INWARD STOCK)
    getPurchases: function() {
      return cache.purchases || [];
    },
    getPurchaseById: function(id) {
      return (cache.purchases || []).find(p => p.id === id);
    },
    addPurchase: async function(purchase) {
      // Increment product stocks locally
      (purchase.items || []).forEach(item => {
        const prod = cache.products.find(p => p.id === item.productId);
        if (prod) {
          prod.stock = (prod.stock || 0) + (parseInt(item.qty) || 0);
          if (item.unitCost && parseFloat(item.unitCost) > 0) {
            prod.costPrice = parseFloat(item.unitCost);
          }
        }
      });
      localStorage.setItem("coorg_harvest_products", JSON.stringify(cache.products));

      cache.purchases.unshift(purchase);
      localStorage.setItem("coorg_harvest_purchases", JSON.stringify(cache.purchases));
      await this.logActivity(`Added purchase bill: ${purchase.invoiceNo} from ${purchase.vendorName}`);

      try {
        await fetch('/api/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(purchase)
        });
      } catch (err) {
        console.error("Error saving purchase to server database:", err);
      }
      return purchase;
    },
    deletePurchase: async function(id) {
      const pur = this.getPurchaseById(id);
      cache.purchases = (cache.purchases || []).filter(p => p.id !== id);
      localStorage.setItem("coorg_harvest_purchases", JSON.stringify(cache.purchases));
      await this.logActivity(`Deleted purchase bill: ${pur?.invoiceNo || id}`);

      try {
        await fetch(`/api/purchases/${id}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error("Error deleting purchase from server database:", err);
      }
    },

    // 5.6. DAMAGED STOCK CRUD
    getDamagedStock: function() {
      return cache.damagedStock || [];
    },
    addDamagedStock: async function(damageData) {
      // Deduct product stock locally
      const prod = cache.products.find(p => p.id === damageData.productId);
      if (prod) {
        prod.stock = Math.max(0, (prod.stock || 0) - (parseInt(damageData.qty) || 1));
        localStorage.setItem("coorg_harvest_products", JSON.stringify(cache.products));
      }

      cache.damagedStock.unshift(damageData);
      localStorage.setItem("coorg_harvest_damaged_stock", JSON.stringify(cache.damagedStock));
      await this.logActivity(`Logged damaged stock: ${damageData.qty}x ${damageData.productName} (${damageData.reason})`);

      try {
        await fetch('/api/damaged-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(damageData)
        });
      } catch (err) {
        console.error("Error saving damaged stock to server database:", err);
      }
      return damageData;
    },
    deleteDamagedStock: async function(id) {
      cache.damagedStock = (cache.damagedStock || []).filter(d => d.id !== id);
      localStorage.setItem("coorg_harvest_damaged_stock", JSON.stringify(cache.damagedStock));
      await this.logActivity(`Removed damaged stock entry: ${id}`);

      try {
        await fetch(`/api/damaged-stock/${id}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error("Error deleting damaged stock entry from server database:", err);
      }
    },
    updateProductStock: async function(productId, newStock) {
      const prod = cache.products.find(p => p.id === productId);
      if (prod) {
        prod.stock = parseInt(newStock) || 0;
        localStorage.setItem("coorg_harvest_products", JSON.stringify(cache.products));
        await this.logActivity(`Stock adjusted for ${prod.name}: ${prod.stock} units`);
      }

      try {
        await fetch(`/api/products/${productId}/stock`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: newStock })
        });
      } catch (err) {
        console.error("Error adjusting stock on server database:", err);
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

  function getFallbackPurchases() {
    return [
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
  }

  function getFallbackDamagedStock() {
    return [
      {
        id: "DMG-2026-001",
        productId: "coffee-caramel",
        productName: "Coorg Caramel Coffee",
        qty: 2,
        unitCost: 195.00,
        totalLoss: 390.00,
        reason: "Transit Damage",
        date: "2026-10-10, 04:30 PM",
        notes: "Glass container cracked during courier transport."
      }
    ];
  }

  function getFallbackOrders() {
    return [
      {
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
        metaData: { amazonOrderId: "408-9821039-1829103" }
      },
      {
        id: "ORD-2026-1042",
        date: "2026-10-14, 03:45 PM",
        name: "Pooja Hegde",
        phone: "+91 9845012345",
        email: "pooja.hegde@outlook.com",
        address: "12, 4th Main, Malleshwaram, Bangalore, Karnataka - 560003",
        items: [
          { id: "teas-masala", name: "Coorg Masala Tea", price: 280, qty: 2, costPrice: 125, category: "Tea Collection" }
        ],
        subtotal: 560,
        discount: 50,
        shipping: 50,
        total: 560,
        paymentMethod: "UPI",
        status: "Delivered",
        trackingId: "BLR-EXP-44120",
        couponCode: "FREESHIP",
        channel: "Website",
        costPrice: 250.00,
        deliveryCost: 45.00,
        commission: 0.00,
        packingCost: 12.00,
        netProfit: 253.00,
        isReturned: 0,
        returnCost: 0,
        returnLoss: 0,
        customerGstin: "",
        gstRate: 5.00,
        taxableAmount: 485.71,
        cgst: 12.14,
        sgst: 12.14,
        igst: 0,
        metaData: {}
      },
      {
        id: "STR-2026-051",
        date: "2026-10-15, 05:10 PM",
        name: "Walk-in Tourist (Madikeri Store)",
        phone: "+91 9449887711",
        email: "",
        address: "Coorg Harvest Store Counter, Raja Seat Road, Madikeri",
        items: [
          { id: "coffee-caramel", name: "Coorg Caramel Coffee", price: 390, qty: 1, costPrice: 195, category: "Coffee Collection" },
          { id: "specialties-kachampuli", name: "Coorg Kachampuli (Garcinia Cambogia Vinegar)", price: 290, qty: 1, costPrice: 140, category: "Coorg Specialties" }
        ],
        subtotal: 680,
        discount: 0,
        shipping: 0,
        total: 680,
        paymentMethod: "Store POS / UPI",
        status: "Delivered",
        trackingId: "POS-COUNTER-SALE",
        channel: "Store",
        costPrice: 335.00,
        deliveryCost: 0.00,
        commission: 0.00,
        packingCost: 8.00,
        netProfit: 337.00,
        isReturned: 0,
        returnCost: 0,
        returnLoss: 0,
        customerGstin: "",
        gstRate: 5.00,
        taxableAmount: 647.62,
        cgst: 16.19,
        sgst: 16.19,
        igst: 0,
        metaData: {}
      }
    ];
  }
})();
