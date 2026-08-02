// COORG HARVEST SERVER-SYNCED DATABASE ADAPTER & CACHING LAYER
(function() {
  // Client-side cache memory
  let cache = {
    products: [],
    coupons: [],
    orders: [],
    logs: [],
    categories: []
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
            
            // Sync fallback storage
            localStorage.setItem("coorg_harvest_products", JSON.stringify(cache.products));
            localStorage.setItem("coorg_harvest_coupons", JSON.stringify(cache.coupons));
            localStorage.setItem("coorg_harvest_orders", JSON.stringify(cache.orders));
            localStorage.setItem("coorg_harvest_activity_logs", JSON.stringify(cache.logs));
            localStorage.setItem("coorg_harvest_categories", JSON.stringify(cache.categories));
            
            console.log("🌿 CoorgDB: Sync with Hostinger MySQL Database completed successfully.");
          })
          .catch(err => {
            console.warn("⚠️ CoorgDB: Sync failed. Falling back to LocalStorage.", err.message);
            // Load from LocalStorage fallback
            cache.products = JSON.parse(localStorage.getItem("coorg_harvest_products")) || [];
            cache.coupons = JSON.parse(localStorage.getItem("coorg_harvest_coupons")) || [];
            cache.orders = JSON.parse(localStorage.getItem("coorg_harvest_orders")) || [];
            cache.logs = JSON.parse(localStorage.getItem("coorg_harvest_activity_logs")) || [];
            cache.categories = JSON.parse(localStorage.getItem("coorg_harvest_categories")) || [
              { id: "premium-spices", name: "Premium Spices" },
              { id: "herbal-teas", name: "Herbal Teas" },
              { id: "coffee-collection", name: "Coffee Collection" },
              { id: "forest-honey", name: "Forest Honey" },
              { id: "wellness-products", name: "Wellness Products" },
              { id: "coorg-specialties", name: "Coorg Specialties" }
            ];
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
    }
  };
})();
