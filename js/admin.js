// ADMIN DASHBOARD CONTROLLER - COORG HARVEST
document.addEventListener("DOMContentLoaded", async function() {
  // Initialize and sync database from server
  await window.CoorgDB.init();

  // 2. Set Active Date
  document.getElementById("admin-date-string").textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // 3. Setup Tab Switches
  setupTabSwitches();

  // 4. Load Analytics Statistics
  loadAnalytics();

  // 5. Populate Data Tables
  renderProductsTable();
  renderOrdersTable();
  renderCouponsTable();
  renderActivityLogsList();
  renderCategoriesTable();

  // 6. Search Listeners
  setupSearches();

  // 7. Logout Handler
  setupLogoutListener();

  // 8. Inactivity Watcher (30 minutes)
  setupInactivityTimeout();

  // 9. Setup Product Image Upload Listener
  setupImageUploadListener();
});

// Seed mock orders and logs to make the dashboard look populated and premium out-of-the-box
function seedMockOrders() {
  const currentOrders = window.CoorgDB.getOrders();
  if (currentOrders.length === 0) {
    const mockOrders = [
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
        discount: 188, // 20% off coupon COORG20
        shipping: 0, // free above 500
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
        shipping: 50, // below 500
        total: 240,
        paymentMethod: "COD",
        status: "Pending COD",
        trackingId: "CHTRK1930219"
      }
    ];

    mockOrders.forEach(o => {
      window.CoorgDB.placeOrder(o);
    });

    // Seed mock activity logs
    window.CoorgDB.logActivity("Admin database initialized and default catalog synced.");
    window.CoorgDB.logActivity("Active promo codes synced: COORG20, FREESHIP, WELCOME10.");
    window.CoorgDB.logActivity("Coorg Harvest online store seed completed successfully.");
  }
}

// Switch between dashboard, products, orders, purchases, inventory, PnL, GST and coupons views
window.switchAdminTab = function(targetView) {
  if (!targetView) return;
  const menuItems = document.querySelectorAll(".admin-menu-item");
  const bottomNavBtns = document.querySelectorAll(".admin-mobile-bottom-nav .mobile-nav-btn");
  const tabs = document.querySelectorAll(".admin-view-tab");
  const viewTitle = document.getElementById("admin-view-title");
  const headerBtn = document.getElementById("admin-header-btn");
  const headerBtnSec = document.getElementById("admin-header-btn-sec");

  // Highlight active menu item
  menuItems.forEach(m => {
    if (m.getAttribute("data-view") === targetView) {
      m.classList.add("active");
    } else {
      m.classList.remove("active");
    }
  });

  // Highlight bottom nav buttons
  bottomNavBtns.forEach(btn => {
    if (btn.getAttribute("data-view") === targetView) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Hide all tabs and show target tab
  tabs.forEach(t => t.style.display = "none");
  const activeTab = document.getElementById(targetView);
  if (activeTab) activeTab.style.display = "block";

  // Close mobile drawer if open
  window.closeAdminMobileDrawer();

  // Scroll to top of content
  window.scrollTo({ top: 0, behavior: "smooth" });

  // View title and header buttons setup
  if (targetView === "dashboard-view") {
    if (viewTitle) viewTitle.textContent = "Dashboard Overview";
    if (headerBtn) {
      headerBtn.style.display = "inline-flex";
      headerBtn.innerHTML = `Add New Product <i class="fa-solid fa-plus"></i>`;
      headerBtn.setAttribute("onclick", "openAddProductModal()");
    }
    if (headerBtnSec) {
      headerBtnSec.style.display = "inline-flex";
      headerBtnSec.innerHTML = `Create Manual Order <i class="fa-solid fa-plus"></i>`;
      headerBtnSec.setAttribute("onclick", "openManualOrderModal()");
    }
    loadAnalytics();
  } else if (targetView === "products-view") {
    if (viewTitle) viewTitle.textContent = "Products Catalog CRUD";
    if (headerBtn) {
      headerBtn.style.display = "inline-flex";
      headerBtn.innerHTML = `Create Product <i class="fa-solid fa-plus"></i>`;
      headerBtn.setAttribute("onclick", "openAddProductModal()");
    }
    if (headerBtnSec) headerBtnSec.style.display = "none";
    renderProductsTable();
  } else if (targetView === "orders-view") {
    if (viewTitle) viewTitle.textContent = "Orders Ledger Log";
    if (headerBtn) {
      headerBtn.style.display = "inline-flex";
      headerBtn.innerHTML = `Create Manual Order <i class="fa-solid fa-plus"></i>`;
      headerBtn.setAttribute("onclick", "openManualOrderModal()");
    }
    if (headerBtnSec) headerBtnSec.style.display = "none";
    renderOrdersTable();
  } else if (targetView === "purchases-view") {
    if (viewTitle) viewTitle.textContent = "Purchases & Inward Vendor Bills";
    if (headerBtn) {
      headerBtn.style.display = "inline-flex";
      headerBtn.innerHTML = `Record Inward Bill <i class="fa-solid fa-plus"></i>`;
      headerBtn.setAttribute("onclick", "openAddPurchaseModal()");
    }
    if (headerBtnSec) headerBtnSec.style.display = "none";
    renderPurchasesTable();
  } else if (targetView === "inventory-view") {
    if (viewTitle) viewTitle.textContent = "Inventory Management & Loss Tracking";
    if (headerBtn) {
      headerBtn.style.display = "inline-flex";
      headerBtn.innerHTML = `Record Damaged Stock <i class="fa-solid fa-triangle-exclamation"></i>`;
      headerBtn.setAttribute("onclick", "openDamagedStockModal()");
    }
    if (headerBtnSec) headerBtnSec.style.display = "none";
    renderInventoryView();
  } else if (targetView === "pnl-view") {
    if (viewTitle) viewTitle.textContent = "P&L & Multi-Channel Economics";
    if (headerBtn) headerBtn.style.display = "none";
    if (headerBtnSec) headerBtnSec.style.display = "none";
    renderPnLView();
  } else if (targetView === "gst-reports-view") {
    if (viewTitle) viewTitle.textContent = "Monthly GST Reports (GSTR-1 & GSTR-3B)";
    if (headerBtn) headerBtn.style.display = "none";
    if (headerBtnSec) headerBtnSec.style.display = "none";
    renderGstReportsView();
  } else if (targetView === "coupons-view") {
    if (viewTitle) viewTitle.textContent = "Discount Coupons Control";
    if (headerBtn) headerBtn.style.display = "none";
    if (headerBtnSec) headerBtnSec.style.display = "none";
    renderCouponsTable();
  } else if (targetView === "categories-view") {
    if (viewTitle) viewTitle.textContent = "Product Categories CRUD";
    if (headerBtn) headerBtn.style.display = "none";
    if (headerBtnSec) headerBtnSec.style.display = "none";
    renderCategoriesTable();
  } else if (targetView === "settings-view") {
    if (viewTitle) viewTitle.textContent = "Store Settings & API Control";
    if (headerBtn) headerBtn.style.display = "none";
    if (headerBtnSec) headerBtnSec.style.display = "none";
    window.loadStoreSettings();
  }
};

window.toggleAdminMobileDrawer = function() {
  const sidebar = document.getElementById("admin-sidebar");
  const backdrop = document.getElementById("admin-sidebar-backdrop");
  if (sidebar) sidebar.classList.toggle("mobile-open");
  if (backdrop) backdrop.classList.toggle("active");
};

window.closeAdminMobileDrawer = function() {
  const sidebar = document.getElementById("admin-sidebar");
  const backdrop = document.getElementById("admin-sidebar-backdrop");
  if (sidebar) sidebar.classList.remove("mobile-open");
  if (backdrop) backdrop.classList.remove("active");
};

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const pwaBtn = document.getElementById("admin-install-pwa-btn");
  if (pwaBtn) pwaBtn.style.display = "flex";
});

window.triggerPwaInstall = async function() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install: ${outcome}`);
    deferredPrompt = null;
  } else {
    alert("To install Coorg Harvest Admin as an app on your phone:\n\n• On Android (Chrome): Tap three dots ⋮ menu -> 'Install app' or 'Add to Home screen'.\n• On iPhone (Safari): Tap the Share button ⎋ -> 'Add to Home Screen'.");
  }
};

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('🌿 PWA Service Worker Registered:', reg.scope))
    .catch(err => console.log('PWA SW notice:', err));
}

function setupTabSwitches() {
  const menuItems = document.querySelectorAll(".admin-menu-item");
  menuItems.forEach(item => {
    item.addEventListener("click", function(e) {
      if (this.getAttribute("href") !== "#") return;
      e.preventDefault();
      const targetView = this.getAttribute("data-view");
      if (targetView) window.switchAdminTab(targetView);
    });
  });
}

// Compute metrics KPIs and render sales bar graph
function loadAnalytics() {
  const products = window.CoorgDB.getProducts();
  const orders = window.CoorgDB.getOrders();

  // 1. KPI Cards
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const lowStockCount = products.filter(p => p.stock < 20).length;

  document.getElementById("stat-revenue").textContent = `₹${totalRevenue.toFixed(2)}`;
  document.getElementById("stat-orders").textContent = orders.length;
  document.getElementById("stat-products").textContent = products.length;
  
  const lowStockEl = document.getElementById("stat-low-stock");
  lowStockEl.textContent = lowStockCount;
  lowStockEl.style.color = lowStockCount > 0 ? "var(--red)" : "var(--primary-green)";

  // 2. Bar Chart Rendering
  const chartContainer = document.getElementById("admin-chart-container");
  if (!chartContainer) return;

  // Take the last 5 orders to construct columns
  const lastOrders = orders.slice(-5);
  
  if (lastOrders.length === 0) {
    chartContainer.innerHTML = `<p style="padding:40px; text-align:center; width:100%; color:var(--medium-gray);">No orders placed yet to chart.</p>`;
    return;
  }

  // Max value to set relative heights
  const maxTotal = Math.max(...lastOrders.map(o => o.total), 1000);

  chartContainer.innerHTML = lastOrders.map(o => {
    const barHeightPercent = (o.total / maxTotal) * 180; // scale to fit 180px
    return `
      <div class="chart-bar-col">
        <div class="chart-bar" style="height: ${barHeightPercent}px;" title="Total: ₹${o.total}">
          <span class="chart-bar-value">₹${o.total}</span>
        </div>
        <span class="chart-bar-label">${o.id}</span>
      </div>
    `;
  }).join('');
}

// PRODUCTS CRUD VIEW TABLES RENDER
function renderProductsTable(filterText = "") {
  const tbody = document.getElementById("product-table-body");
  if (!tbody) return;

  const products = window.CoorgDB.getProducts();
  const query = filterText.toLowerCase();

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.category.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--medium-gray);">No matching products found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => `
    <tr>
      <td data-label="Image"><img src="${p.image}" alt="${p.name}"></td>
      <td data-label="Product Name" style="font-weight:600; color:var(--primary-green);">${p.name}</td>
      <td data-label="Category">${p.category}</td>
      <td data-label="Price" style="font-weight:600;">
        ₹${p.price}
        <div style="font-size:0.75rem; color:${(p.gstType || 'inclusive') === 'inclusive' ? '#15803d' : '#b45309'}; font-weight:500;">
          ${p.gstRate !== undefined ? p.gstRate : 5}% GST (${(p.gstType || 'inclusive') === 'inclusive' ? 'Inc' : 'Excl'})
        </div>
      </td>
      <td data-label="Stock">
        <span style="font-weight:600; color:${p.stock < 20 ? 'var(--red)' : 'var(--dark-text)'};">
          ${p.stock} units
        </span>
        ${p.stock < 20 ? '<br><small style="color:var(--red); font-weight:500;">(Low stock warning)</small>' : ''}
      </td>
      <td data-label="Rating"><i class="fa-solid fa-star" style="color:#F39C12;"></i> ${p.rating.toFixed(1)} (${p.ratingCount})</td>
      <td data-label="Actions">
        <div class="action-btns" style="justify-content: flex-end;">
          <button class="action-btn edit" onclick="openEditProductModal('${p.id}')" title="Edit Specs"><i class="fa-regular fa-pen-to-square"></i></button>
          <button class="action-btn delete" onclick="deleteProductHandler('${p.id}')" title="Delete Product"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

// CRUD Modal Form interactions
window.openAddProductModal = function() {
  populateCategoryDropdown();
  document.getElementById("modal-form-title").textContent = "Add New Product";
  document.getElementById("product-crud-form").reset();
  document.getElementById("crud-id").value = "";
  document.getElementById("crud-old-price").value = "";
  document.getElementById("crud-cost-price").value = "";
  document.getElementById("crud-gst-rate").value = "5";
  const gstTypeEl = document.getElementById("crud-gst-type");
  if (gstTypeEl) gstTypeEl.value = "inclusive";
  document.getElementById("crud-hsn").value = "0901";
  document.getElementById("crud-stock").value = "50";
  
  // Set default placeholder nature image
  document.getElementById("crud-image").value = "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80";

  resetUploadStatus();
  window.renderGalleryImages([]);
  document.getElementById("product-modal-overlay").classList.add("active");
};

window.openEditProductModal = function(id) {
  populateCategoryDropdown();
  const p = window.CoorgDB.getProductById(id);
  if (!p) return;

  document.getElementById("modal-form-title").textContent = "Edit Product Specs";
  document.getElementById("crud-id").value = p.id;
  document.getElementById("crud-name").value = p.name;
  document.getElementById("crud-category").value = p.category;
  document.getElementById("crud-price").value = p.price;
  document.getElementById("crud-old-price").value = p.oldPrice || "";
  document.getElementById("crud-cost-price").value = p.costPrice !== undefined ? p.costPrice : "";
  document.getElementById("crud-gst-rate").value = p.gstRate !== undefined ? p.gstRate : "5";
  const gstTypeEl = document.getElementById("crud-gst-type");
  if (gstTypeEl) gstTypeEl.value = p.gstType || "inclusive";
  document.getElementById("crud-hsn").value = p.hsnCode || "0901";
  document.getElementById("crud-stock").value = p.stock;
  document.getElementById("crud-image").value = p.image;
  document.getElementById("crud-desc").value = p.description;
  document.getElementById("crud-origin").value = p.origin;
  document.getElementById("crud-ingredients").value = (p.ingredients || []).join(", ");
  document.getElementById("crud-benefits").value = (p.benefits || []).join(", ");
  document.getElementById("crud-usage").value = p.usage || "";

  resetUploadStatus();
  window.renderGalleryImages(p.images || []);
  document.getElementById("product-modal-overlay").classList.add("active");
};

window.closeProductModal = function() {
  resetUploadStatus();
  document.getElementById("product-modal-overlay").classList.remove("active");
};

window.saveProductCrudForm = async function() {
  const form = document.getElementById("product-crud-form");
  if (!form.reportValidity()) return;

  const id = document.getElementById("crud-id").value;
  const name = document.getElementById("crud-name").value.trim();
  const category = document.getElementById("crud-category").value;
  const price = parseFloat(document.getElementById("crud-price").value);
  const oldPriceVal = document.getElementById("crud-old-price").value;
  const oldPrice = oldPriceVal ? parseFloat(oldPriceVal) : null;
  const costPriceVal = document.getElementById("crud-cost-price")?.value;
  const costPrice = costPriceVal !== "" ? parseFloat(costPriceVal) : Math.round(price * 0.5);
  const gstRate = parseFloat(document.getElementById("crud-gst-rate")?.value) || 5.0;
  const gstType = document.getElementById("crud-gst-type")?.value || "inclusive";
  const hsnCode = document.getElementById("crud-hsn")?.value.trim() || "0901";
  const stock = parseInt(document.getElementById("crud-stock").value) || 0;
  const image = document.getElementById("crud-image").value;
  const description = document.getElementById("crud-desc").value.trim();
  const origin = document.getElementById("crud-origin").value.trim();
  const ingredients = document.getElementById("crud-ingredients").value.split(",").map(i => i.trim()).filter(Boolean);
  const benefits = document.getElementById("crud-benefits").value.split(",").map(b => b.trim()).filter(Boolean);
  const usage = document.getElementById("crud-usage").value.trim();

  const galleryImages = Array.from(document.querySelectorAll(".gallery-image-url")).map(input => input.value.trim()).filter(val => val !== "");

  if (id) {
    // Modify Edit mode
    const oldProduct = window.CoorgDB.getProductById(id);
    const updated = {
      ...oldProduct,
      name, category, price, oldPrice, costPrice, gstRate, gstType, hsnCode, stock, image, description, origin, ingredients, benefits, usage,
      images: galleryImages
    };
    await window.CoorgDB.updateProduct(updated);
  } else {
    // New Product Mode
    const newId = category.toLowerCase().replace(/ /g, "-") + "-" + name.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
    const newProduct = {
      id: newId,
      name, category, price, oldPrice, costPrice, gstRate, gstType, hsnCode, stock, image, description, origin, ingredients, benefits, usage,
      rating: 5.0,
      ratingCount: 0,
      badge: "New Sourcing",
      reviews: [],
      images: galleryImages
    };
    await window.CoorgDB.addProduct(newProduct);
  }

  closeProductModal();
  renderProductsTable();
  if (typeof renderInventoryView === 'function') renderInventoryView();
  loadAnalytics(); // update metrics count
};

window.deleteProductHandler = async function(id) {
  if (confirm("Are you sure you want to permanently delete this product from the catalog?")) {
    await window.CoorgDB.deleteProduct(id);
    renderProductsTable();
    loadAnalytics();
  }
};


// ORDERS log table render with multi-channel and profit metrics
function renderOrdersTable(filterText = "") {
  const tbody = document.getElementById("order-table-body");
  if (!tbody) return;

  const orders = window.CoorgDB.getOrders();
  const searchInput = document.getElementById("order-table-search");
  const query = (filterText || (searchInput ? searchInput.value : "")).toLowerCase();
  
  const channelFilter = document.getElementById("order-filter-channel")?.value || "ALL";
  const statusFilter = document.getElementById("order-filter-status")?.value || "ALL";

  const filtered = orders.filter(o => {
    const matchesSearch = (o.id && o.id.toLowerCase().includes(query)) || 
                          (o.name && o.name.toLowerCase().includes(query)) ||
                          (o.phone && o.phone.toLowerCase().includes(query)) ||
                          (o.customerGstin && o.customerGstin.toLowerCase().includes(query));
    const orderChannel = o.channel || "Website";
    const matchesChannel = channelFilter === "ALL" || orderChannel === channelFilter;
    const matchesStatus = statusFilter === "ALL" || (statusFilter === "Returned" ? o.isReturned : o.status === statusFilter);

    return matchesSearch && matchesChannel && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--medium-gray);">No orders matching your filters.</td></tr>`;
    return;
  }

  // Sort orders latest first
  const sorted = [...filtered].sort((a,b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = sorted.map(o => {
    const channel = o.channel || "Website";
    let channelBadge = `<span style="display:inline-block; font-size:0.7rem; padding:2px 6px; border-radius:3px; background:#e8f5e9; color:#1b5e20; font-weight:600;"><i class="fa-solid fa-globe"></i> Website</span>`;
    if (channel === "Amazon") {
      channelBadge = `<span style="display:inline-block; font-size:0.7rem; padding:2px 6px; border-radius:3px; background:#fff3e0; color:#e65100; font-weight:600;"><i class="fa-brands fa-amazon"></i> Amazon</span>`;
    } else if (channel === "Meesho") {
      channelBadge = `<span style="display:inline-block; font-size:0.7rem; padding:2px 6px; border-radius:3px; background:#fce4ec; color:#c2185b; font-weight:600;"><i class="fa-solid fa-bag-shopping"></i> Meesho</span>`;
    } else if (channel === "Flipkart") {
      channelBadge = `<span style="display:inline-block; font-size:0.7rem; padding:2px 6px; border-radius:3px; background:#e3f2fd; color:#0d47a1; font-weight:600;"><i class="fa-solid fa-bolt"></i> Flipkart</span>`;
    } else if (channel === "WhatsApp") {
      channelBadge = `<span style="display:inline-block; font-size:0.7rem; padding:2px 6px; border-radius:3px; background:#e8f8f0; color:#0a8754; font-weight:600;"><i class="fa-brands fa-whatsapp"></i> WhatsApp</span>`;
    } else if (channel === "Instagram") {
      channelBadge = `<span style="display:inline-block; font-size:0.7rem; padding:2px 6px; border-radius:3px; background:#fdf2f8; color:#db2777; font-weight:600;"><i class="fa-brands fa-instagram"></i> Instagram</span>`;
    } else if (channel === "Store" || channel === "Offline") {
      channelBadge = `<span style="display:inline-block; font-size:0.7rem; padding:2px 6px; border-radius:3px; background:#f3e5f5; color:#4a148c; font-weight:600;"><i class="fa-solid fa-store"></i> Store Walk-in</span>`;
    } else if (channel === "Phone") {
      channelBadge = `<span style="display:inline-block; font-size:0.7rem; padding:2px 6px; border-radius:3px; background:#fef3c7; color:#b45309; font-weight:600;"><i class="fa-solid fa-phone"></i> Phone Order</span>`;
    }

    let profitBadge = "";
    if (o.isReturned) {
      profitBadge = `<span style="font-size:0.78rem; font-weight:600; color:var(--red); display:block; line-height:1.2;">
        <i class="fa-solid fa-arrow-rotate-left"></i> Returned<br>
        <small style="color:var(--red);">Loss: -₹${(parseFloat(o.returnLoss) || 0).toFixed(2)}</small>
      </span>`;
    } else {
      const netProfit = typeof o.netProfit === "number" ? o.netProfit : ((o.total || 0) * 0.32);
      const margin = o.total > 0 ? ((netProfit / o.total) * 100).toFixed(0) : 0;
      const color = netProfit >= 0 ? "var(--primary-green)" : "var(--red)";
      profitBadge = `<span style="font-size:0.85rem; font-weight:700; color:${color}; display:block; line-height:1.2;">
        ₹${netProfit.toFixed(2)}<br>
        <small style="color:${color}; font-weight:600;">(${margin}% net)</small>
      </span>`;
    }

    return `
    <tr>
      <td data-label="Order ID / Channel">
        <div style="font-weight:600; color:var(--primary-green); font-size:0.9rem;">${o.id}</div>
        <div style="margin-top:3px;">${channelBadge}</div>
      </td>
      <td data-label="Customer">
        <strong>${o.name}</strong><br>
        <small style="color:var(--medium-gray);">${o.phone}</small>
        ${o.customerGstin ? `<br><span style="font-size:0.7rem; background:#eee; padding:1px 4px; border-radius:3px; color:#555;">GSTIN: ${o.customerGstin}</span>` : ''}
      </td>
      <td data-label="Date" style="font-size:0.85rem;">${o.date}</td>
      <td data-label="Amount" style="font-weight:700; font-size:0.95rem;">₹${(parseFloat(o.total) || 0).toFixed(2)}</td>
      <td data-label="Net Profit">${profitBadge}</td>
      <td data-label="Payment / Status">
        <div style="font-size:0.75rem; font-weight:600; color:var(--earth-brown); margin-bottom:4px;">${o.paymentMethod || 'UPI'}</div>
        <select class="form-control" style="padding:4px 6px; font-size:0.75rem; border-radius:4px; border-color:var(--light-gray); width: 100%; max-width: 130px;" onchange="changeOrderStatusHandler('${o.id}', this.value)">
          <option value="Paid" ${o.status === 'Paid' ? 'selected' : ''}>Paid / Verified</option>
          <option value="Pending COD" ${o.status === 'Pending COD' ? 'selected' : ''}>Pending COD</option>
          <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Returned" ${o.isReturned || o.status === 'Returned' ? 'selected' : ''}>Returned / RTO</option>
        </select>
      </td>
      <td data-label="Tracking">
        <div style="display: flex; gap: 4px; align-items: center; justify-content: flex-end; width: 100%;">
          <input type="text" class="form-control" value="${o.trackingId || ''}" id="track-${o.id}" style="padding: 4px 6px; font-size: 0.75rem; border-radius: 4px; border: 1px solid var(--light-gray); width: 95px;" placeholder="Track ID...">
          <button class="action-btn" onclick="updateOrderTrackingHandler('${o.id}')" style="padding: 4px 6px; background-color: var(--primary-green); color: white; border-radius: 4px; border: none; cursor: pointer; font-size: 0.75rem;" title="Save Tracking"><i class="fa-solid fa-floppy-disk"></i></button>
        </div>
      </td>
      <td data-label="Actions">
        <div class="action-btns" style="display: flex; gap: 6px; justify-content: flex-end; align-items:center;">
          <button class="action-btn download" style="background-color: var(--primary-green); color: white; padding:5px 7px;" onclick="adminDownloadInvoice('${o.id}')" title="Download Invoice PDF"><i class="fa-solid fa-file-invoice"></i></button>
          <button class="action-btn download" style="background-color: var(--accent-gold); color: white; padding:5px 7px;" onclick="adminDownloadDeliverySlip('${o.id}')" title="Download Delivery Slip"><i class="fa-solid fa-truck-ramp-box"></i></button>
          <button class="action-btn" style="background-color: #2980b9; color: white; padding:5px 7px;" onclick="openOrderPnLModal('${o.id}')" title="P&L Unit Economics Breakdown"><i class="fa-solid fa-scale-balanced"></i></button>
          ${!o.isReturned ? `<button class="action-btn" style="background-color: #e67e22; color: white; padding:5px 7px;" onclick="openOrderReturnModal('${o.id}')" title="Process Return / RTO"><i class="fa-solid fa-arrow-rotate-left"></i></button>` : ''}
          <button class="action-btn delete" onclick="deleteOrderHandler('${o.id}')" title="Delete Order" style="padding:5px 7px;"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      </td>
    </tr>
    `;
  }).join('');
}

window.filterOrders = function() {
  renderOrdersTable();
};

window.changeOrderStatusHandler = async function(orderId, newStatus) {
  await window.CoorgDB.updateOrderStatus(orderId, newStatus);
  renderOrdersTable();
  renderActivityLogsList();
};

window.updateOrderTrackingHandler = async function(orderId) {
  const input = document.getElementById(`track-${orderId}`);
  if (!input) return;
  const trackingId = input.value.trim();
  
  await window.CoorgDB.updateOrderTracking(orderId, trackingId);
  alert(`Tracking ID updated successfully for order ${orderId}!`);
  renderOrdersTable();
  renderActivityLogsList();
};

window.deleteOrderHandler = async function(orderId) {
  if (confirm(`Are you sure you want to permanently delete order ${orderId}? This action cannot be undone.`)) {
    await window.CoorgDB.deleteOrder(orderId);
    renderOrdersTable();
    loadAnalytics();
    renderActivityLogsList();
    renderCouponsTable();
  }
};

// Admin Reprinting PDF Action (binds to success page invoice methods)
window.adminDownloadInvoice = async function(id) {
  const order = window.CoorgDB.getOrderById(id);
  if (!order) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const themeColor = "#2E5E3E";
  const goldColor = "#C5A059";

  // Load Logo & Signature
  const logoBase64 = await loadOriginalLogo();
  const sigBase64 = await loadProprietorSignature();
  const settings = window.CoorgDB.getSettings() || {};
  const companyName = "COORG HARVEST"; // AGRO & SPICES removed as requested
  const proprietorName = settings.company_proprietor || "FAABID FAIZAL P M";
  const companyGstin = settings.company_gstin || "29IJLPM3578P1ZX";
  const companyFssai = settings.company_fssai || "21226110000154";
  const companyAddress = settings.company_address || "Bypass Road, Gonikopal, Kodagu - 571213, Karnataka";
  const companyPhone = settings.company_phone || "+91 9880077218";
  const companyEmail = settings.company_email || "info@coorgharvest.com";
  const companyState = settings.company_state_code || "29";

  // HEADER SECTION (Clean, premium branding)
  if (logoBase64) {
    // Render company logo
    doc.addImage(logoBase64, 'PNG', 15, 8, 22, 22);
    
    doc.setTextColor(46, 94, 62); // Theme Green
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(companyName, 40, 18);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(197, 160, 89); // Gold
    doc.text("Premium Spices, Plantation Coffee & Wellness from Kodagu", 40, 24);
  } else {
    // Fallback if logo fails
    doc.setTextColor(46, 94, 62);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(companyName, 15, 18);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(197, 160, 89);
    doc.text("Premium Spices, Plantation Coffee & Wellness from Kodagu", 15, 24);
  }

  // Company details on the right - RIGHT-ALIGNED to 195 to completely prevent overlap
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Email: ${companyEmail}`, 195, 11, { align: "right" });
  doc.text(`Phone: ${companyPhone}`, 195, 15.5, { align: "right" });
  doc.text(`GSTIN: ${companyGstin} (State: ${companyState} - Karnataka)`, 195, 20, { align: "right" });
  if (companyFssai) doc.text(`FSSAI Lic: ${companyFssai}`, 195, 24.5, { align: "right" });
  doc.text(companyAddress, 195, 29, { align: "right" });

  // Separator Line
  doc.setDrawColor(220, 215, 200);
  doc.setLineWidth(0.4);
  doc.line(15, 34, 195, 34);

  // META
  doc.setTextColor(29, 29, 29);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("TAX INVOICE", 15, 46);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Invoice No: ${order.id}`, 15, 53);
  doc.text(`Invoice Date: ${order.date}`, 15, 58.5);
  doc.text(`Sales Channel: ${order.channel || 'Direct / Website'}`, 15, 64);
  doc.text(`Payment: ${order.paymentMethod || 'UPI'} (${order.status})`, 15, 69.5);

  // BILLING ADDRESS
  doc.setFont("helvetica", "bold");
  doc.text("Billed & Shipped To:", 125, 46);
  doc.setFont("helvetica", "normal");
  
  const splitAddress = doc.splitTextToSize(order.address || 'Customer Walk-in / Counter Delivery', 70);
  doc.text(order.name || 'Walk-in Customer', 125, 53);
  doc.text(`Phone: ${order.phone || 'N/A'}`, 125, 58.5);
  if (order.email) doc.text(`Email: ${order.email}`, 125, 64);
  if (order.customerGstin) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(46, 94, 62);
    doc.text(`Customer GSTIN: ${order.customerGstin}`, 125, 69.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(splitAddress, 125, 75);
  } else {
    doc.text(splitAddress, 125, 69.5);
  }

  // TABLE HEADERS
  doc.setDrawColor(232, 226, 213);
  doc.setFillColor(247, 243, 232);
  doc.rect(15, 90, 180, 8, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(46, 94, 62);
  doc.setFontSize(8.5);
  doc.text("Item / Sourced Product Name", 18, 95.5);
  doc.text("HSN", 96, 95.5);
  doc.text("Price (INR)", 114, 95.5);
  doc.text("Qty", 140, 95.5);
  doc.text("GST %", 154, 95.5);
  doc.text("Total (INR)", 173, 95.5);
  
  doc.line(15, 98, 195, 98);

  // TABLE BODY ITEMS
  doc.setFont("helvetica", "normal");
  doc.setTextColor(29, 29, 29);
  doc.setFontSize(8);
  let currentY = 105;

  let computedTaxable = 0;
  let computedTotalTax = 0;

  (order.items || []).forEach(item => {
    const prod = (window.CoorgDB && window.CoorgDB.getProductById) ? window.CoorgDB.getProductById(item.id) : null;
    const hsn = item.hsnCode || (prod && prod.hsnCode) || "0901";
    const itemGstRate = (item.gstRate !== undefined && item.gstRate !== null) 
      ? parseFloat(item.gstRate) 
      : ((prod && prod.gstRate !== undefined) ? parseFloat(prod.gstRate) : (order.gstRate || 5.0));
    const itemGstType = item.gstType || (prod && prod.gstType) || "inclusive";
    const lineTotal = (item.price || 0) * (item.qty || 1);

    // Compute line taxable amount and tax
    let lineTaxable = 0;
    let lineTax = 0;
    if (itemGstType === "exclusive") {
      lineTaxable = lineTotal;
      lineTax = lineTotal * (itemGstRate / 100);
    } else {
      lineTaxable = lineTotal / (1 + (itemGstRate / 100));
      lineTax = lineTotal - lineTaxable;
    }
    computedTaxable += lineTaxable;
    computedTotalTax += lineTax;

    const nameLines = doc.splitTextToSize(item.name || 'Item', 74);
    doc.text(nameLines, 18, currentY);
    doc.text(hsn.toString(), 96, currentY);
    doc.text(`Rs. ${(item.price || 0).toFixed(2)}`, 114, currentY);
    doc.text((item.qty || 1).toString(), 141, currentY);
    doc.text(`${itemGstRate}%`, 156, currentY);
    doc.text(`Rs. ${lineTotal.toFixed(2)}`, 173, currentY);

    const step = Math.max(nameLines.length * 4.5, 7.5);
    currentY += step;
  });

  doc.line(15, currentY + 2, 195, currentY + 2);
  currentY += 10;

  // MATHS & TAXES
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Subtotal:", 125, currentY);
  doc.text(`Rs. ${(order.subtotal || 0).toFixed(2)}`, 173, currentY);
  currentY += 5.5;

  if (order.discount > 0) {
    doc.setTextColor(39, 174, 96);
    doc.text("Discount Applied:", 125, currentY);
    doc.text(`-Rs. ${(order.discount || 0).toFixed(2)}`, 173, currentY);
    doc.setTextColor(29, 29, 29);
    currentY += 5.5;
  }

  doc.text("Delivery / Freight:", 125, currentY);
  doc.text(order.shipping === 0 ? "FREE" : `Rs. ${(order.shipping || 0).toFixed(2)}`, 173, currentY);
  currentY += 5.5;

  const otherExp = parseFloat(order.otherExpense || order.otherExpenses || 0);
  if (otherExp > 0) {
    doc.text("Other Expenses / Handling:", 125, currentY);
    doc.text(`Rs. ${otherExp.toFixed(2)}`, 173, currentY);
    currentY += 5.5;
  }

  doc.line(125, currentY - 1, 195, currentY - 1);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(46, 94, 62);
  doc.text("Invoice Total (Inc. GST):", 125, currentY + 3.5);
  doc.text(`Rs. ${(order.total || 0).toFixed(2)}`, 173, currentY + 3.5);
  currentY += 9;

  // Comprehensive GST Breakdown
  const isInterState = Boolean(order.customerGstin && !order.customerGstin.startsWith("29"));
  const finalTaxable = (order.taxableAmount !== undefined && order.taxableAmount !== null)
    ? parseFloat(order.taxableAmount)
    : parseFloat(computedTaxable.toFixed(2));
  const finalTax = (order.cgst !== undefined && order.sgst !== undefined)
    ? parseFloat((parseFloat(order.cgst) + parseFloat(order.sgst) + (parseFloat(order.igst) || 0)).toFixed(2))
    : parseFloat(computedTotalTax.toFixed(2));

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(46, 94, 62);
  doc.text("GST Tax Breakdown:", 125, currentY);
  currentY += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total Taxable Value: Rs. ${finalTaxable.toFixed(2)}`, 125, currentY);
  currentY += 4;

  if (isInterState) {
    const igstVal = order.igst !== undefined ? parseFloat(order.igst).toFixed(2) : finalTax.toFixed(2);
    doc.text(`IGST (Inter-State): Rs. ${igstVal}`, 125, currentY);
    currentY += 4;
  } else {
    let cgstVal = (finalTax / 2).toFixed(2);
    let sgstVal = (finalTax / 2).toFixed(2);
    if (order.cgst !== undefined && order.sgst !== undefined) {
      cgstVal = parseFloat(order.cgst).toFixed(2);
      sgstVal = parseFloat(order.sgst).toFixed(2);
    }
    doc.text(`CGST (Intra-State 50%): Rs. ${cgstVal}`, 125, currentY);
    currentY += 4;
    doc.text(`SGST (Intra-State 50%): Rs. ${sgstVal}`, 125, currentY);
    currentY += 4;
  }
  doc.text(`Total Tax (GST): Rs. ${finalTax.toFixed(2)}`, 125, currentY);
  currentY += 6;

  const codDeposit = order.codDeposit !== undefined ? order.codDeposit : (order.couponCode === "MANUAL" ? 0 : 50);
  if (order.paymentMethod && order.paymentMethod.toUpperCase() === 'COD') {
    if (codDeposit > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(29, 29, 29);
      doc.text("COD Deposit Paid (Online):", 125, currentY);
      doc.text(`-Rs. ${codDeposit.toFixed(2)}`, 172, currentY);
      currentY += 6;
      
      doc.line(125, currentY - 2, 195, currentY - 2);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(180, 50, 50);
      doc.text("Balance Due on Delivery:", 125, currentY + 3);
      doc.text(`Rs. ${(order.total - codDeposit).toFixed(2)}`, 172, currentY + 3);
      currentY += 12;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(150, 50, 50);
      doc.text(`*Note: Online COD deposit of Rs. ${codDeposit.toFixed(2)} is non-refundable.`, 15, currentY - 12);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(180, 50, 50);
      doc.text("Balance Due on Delivery:", 125, currentY + 3);
      doc.text(`Rs. ${(order.total || 0).toFixed(2)}`, 172, currentY + 3);
      currentY += 12;
    }
  }

  // BOTTOM SECTION: VERIFIED BADGE ON LEFT & PROPRIETOR SIGNATURE ON RIGHT
  const stampY = Math.max(currentY + 6, 218);
  
  // Left: Official Tax Invoice Verified Seal
  doc.setDrawColor(46, 94, 62);
  doc.setLineWidth(0.4);
  doc.circle(32, stampY + 12, 10, "S");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(46, 94, 62);
  doc.text("TAX INVOICE", 32, stampY + 10, null, null, "center");
  doc.text("VERIFIED", 32, stampY + 13, null, null, "center");

  // Right: Proprietor Signature Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(46, 94, 62);
  doc.text("For COORG HARVEST", 165, stampY, { align: "center" });

  if (sigBase64) {
    doc.addImage(sigBase64, 'PNG', 148, stampY + 2, 34, 16);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(29, 29, 29);
  doc.text(proprietorName, 165, stampY + 21, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text("Proprietor / Authorized Signatory", 165, stampY + 25, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text("Thank you for supporting Kodagu's small farmers!", 105, 280, null, null, "center");

  // SAVE
  doc.save(`Invoice_${order.id}.pdf`);
};

// Helper to load original company logo as full color data URL
const loadOriginalLogo = () => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error("Failed to convert logo to data URL:", err);
        resolve(null);
      }
    };
    img.onerror = () => {
      // Try fallback path if images/logo.png wasn't found directly
      const fallback = new Image();
      fallback.crossOrigin = "anonymous";
      fallback.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = fallback.width;
          canvas.height = fallback.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(fallback, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch(e) { resolve(null); }
      };
      fallback.onerror = () => resolve(null);
      fallback.src = 'logo.png';
    };
    img.src = 'images/logo.png';
  });
};

// Helper to load proprietor signature as transparent data URL
const loadProprietorSignature = () => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error("Failed to convert signature to data URL:", err);
        resolve(null);
      }
    };
    img.onerror = () => {
      // Fallback to jpg version if png fails
      const fallback = new Image();
      fallback.crossOrigin = "anonymous";
      fallback.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = fallback.width;
          canvas.height = fallback.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(fallback, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch(e) { resolve(null); }
      };
      fallback.onerror = () => resolve(null);
      fallback.src = 'images/proprietor_signature.jpg';
    };
    img.src = 'images/proprietor_signature.png';
  });
};

// Helper to load company logo and convert it to solid black for thermal printing
const loadBlackLogo = () => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          const a = data[i+3];
          if (a > 0) {
            // Calculate grayscale luminance
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            if (gray > 240) {
              data[i+3] = 0; // Turn white/light background transparent
            } else {
              // Convert to solid black while preserving original anti-aliased opacity
              data[i] = 0;
              data[i+1] = 0;
              data[i+2] = 0;
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error("Failed to process logo to black:", err);
        resolve(null);
      }
    };
    img.onerror = (err) => {
      console.error("Failed to load logo image:", err);
      resolve(null);
    };
    img.src = 'logo.png';
  });
};

const loadQrCode = function(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
  });
};

// Admin Reprinting 4x6 Delivery Label
window.adminDownloadDeliverySlip = async function(id) {
  const order = window.CoorgDB.getOrderById(id);
  if (!order) return;

  const { jsPDF } = window.jspdf;
  // Initialize in inches (4x6 format)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [4, 6]
  });

  // Try to load and add the black logo image
  const logoDataUrl = await loadBlackLogo();
  if (logoDataUrl) {
    // Width: 1.1 in, Height: 0.93 in (retains 1.18 aspect ratio: 657/555)
    doc.addImage(logoDataUrl, 'PNG', 0.25, 0.25, 1.1, 0.93);
  }

  // Margins & branding (All in pure black)
  doc.setTextColor(0, 0, 0);
  
  // Sender Details (next to logo, starts at x=1.45)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("FROM:", 1.45, 0.35);
  doc.setFont("helvetica", "bold");
  doc.text("COORG HARVEST", 1.45, 0.50);
  doc.setFont("helvetica", "normal");
  doc.text("Bypass Road, Gonikopal,", 1.45, 0.65);
  doc.text("Kodagu - 571213", 1.45, 0.80);
  doc.text("Phone: +91 9880077218", 1.45, 0.95);

  // Outer border box (0.15 in margins all around: fits 3.7x5.7 within 4x6 page)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.015);
  doc.rect(0.15, 0.15, 3.7, 5.7);

  // Separator line under header
  doc.line(0.15, 1.25, 3.85, 1.25);

  // SHIP TO: Section (Recipient box with black outline, white background)
  doc.rect(0.2, 1.35, 3.6, 1.2);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SHIP TO:", 0.3, 1.55);

  doc.setFontSize(10);
  doc.text(order.name, 0.3, 1.75);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const splitAddr = doc.splitTextToSize(order.address, 3.4);
  doc.text(splitAddr, 0.3, 1.95);
  doc.setFont("helvetica", "bold");
  doc.text(`Phone: ${order.phone}`, 0.3, 2.43);

  // Separator line under SHIP TO section
  doc.line(0.15, 2.65, 3.85, 2.65);

  // Order meta info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Order ID: ${order.id}`, 0.25, 2.82);
  doc.text(`Date: ${order.date.split(',')[0]}`, 0.25, 2.97);
  doc.text(`Tracking ID: ${order.trackingId}`, 0.25, 3.12);

  const codDeposit = order.codDeposit !== undefined ? order.codDeposit : (order.couponCode === "MANUAL" ? 0 : 50);
  // Cash collect display (Outline box, white background)
  let collectAmount = 0;
  let statusText = "PAID ONLINE (PAID)";
  if (order.paymentMethod.toUpperCase() === 'COD') {
    collectAmount = order.total - codDeposit;
    statusText = `CASH TO COLLECT (COD): INR ${collectAmount.toFixed(2)}`;
  }

  doc.rect(0.2, 3.25, 3.6, 0.45);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(statusText, 0.3, 3.53);

  // Separator line under Order/Payment section
  doc.line(0.15, 3.82, 3.85, 3.82);

  // Items checklist
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PACKING ITEMS CHECKLIST:", 0.25, 4.02);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  let itemY = 4.22;
  order.items.forEach((item, index) => {
    // Checkbox
    doc.rect(0.25, itemY - 0.08, 0.1, 0.1);
    
    // Qty & Name
    doc.setFont("helvetica", "bold");
    doc.text(`[ Qty: ${item.qty} ]`, 0.45, itemY);
    doc.setFont("helvetica", "normal");
    doc.text(item.name.substring(0, 32), 1.2, itemY);
    
    itemY += 0.22;
  });

  // Fetch and insert dynamic QR Code
  const qrDataUrl = await loadQrCode('https://coorgharvest.com');
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', 2.9, 4.65, 0.8, 0.8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("coorgharvest.com", 3.3, 5.58, null, null, "center");
  }

  // Footer label tag
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Coorg Harvest Courier Label (4x6)", 2.0, 5.75, null, null, "center");

  doc.save(`Label_${order.id}.pdf`);
};


// COUPON codes control list render
function renderCouponsTable() {
  const tbody = document.getElementById("coupon-table-body");
  if (!tbody) return;

  const coupons = window.CoorgDB.getCoupons();
  const orders = window.CoorgDB.getOrders();

  if (coupons.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--medium-gray);">No coupons created.</td></tr>`;
    return;
  }

  tbody.innerHTML = coupons.map(c => {
    const couponOrders = orders.filter(o => o.couponCode && o.couponCode.toUpperCase() === c.code.toUpperCase());
    const totalSales = couponOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const usageText = couponOrders.length === 1 ? '1 order' : `${couponOrders.length} orders`;
    return `
      <tr>
        <td style="font-weight:700; color:var(--accent-gold);">${c.code}</td>
        <td style="text-transform:capitalize;">${c.type}</td>
        <td style="font-weight:600;">${c.type === 'percent' ? c.value + '%' : '₹' + c.value}</td>
        <td>${c.description}</td>
        <td style="font-weight:600; color:var(--primary-green);">${usageText} (₹${totalSales.toFixed(2)})</td>
        <td>
          <button class="action-btn delete" onclick="deleteCouponHandler('${c.code}')" title="Delete Coupon"><i class="fa-regular fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

window.handleCreateCoupon = async function(e) {
  e.preventDefault();
  
  const code = document.getElementById("coupon-code").value.trim().toUpperCase();
  const type = document.getElementById("coupon-type").value;
  const value = parseFloat(document.getElementById("coupon-value").value);
  const description = document.getElementById("coupon-desc").value.trim();

  if (!code || isNaN(value) || !description) return;

  const newCoupon = { code, type, value, description };
  await window.CoorgDB.addCoupon(newCoupon);
  
  document.getElementById("admin-coupon-form").reset();
  renderCouponsTable();
};

window.deleteCouponHandler = async function(code) {
  if (confirm(`Are you sure you want to delete coupon code ${code}?`)) {
    await window.CoorgDB.deleteCoupon(code);
    renderCouponsTable();
  }
};


// SYSTEM logs logs list render
function renderActivityLogsList() {
  const container = document.getElementById("admin-activity-logs");
  if (!container) return;

  const logs = window.CoorgDB.getActivityLogs();

  if (logs.length === 0) {
    container.innerHTML = `<p style="padding:20px; text-align:center; color:var(--medium-gray); font-size:0.85rem;">No activity log records.</p>`;
    return;
  }

  container.innerHTML = logs.map(l => `
    <div class="activity-item">
      <div class="activity-icon"><i class="fa-solid fa-bell"></i></div>
      <div class="activity-details">
        <p>${l.text}</p>
        <span>${l.time}</span>
      </div>
    </div>
  `).join('');
}

window.clearActivityLogs = function() {
  localStorage.removeItem("coorg_harvest_activity_logs");
  renderActivityLogsList();
};


// Searches input bindings
function setupSearches() {
  const productSearch = document.getElementById("product-table-search");
  const orderSearch = document.getElementById("order-table-search");

  if (productSearch) {
    productSearch.addEventListener("input", function() {
      renderProductsTable(this.value);
    });
  }

  if (orderSearch) {
    orderSearch.addEventListener("input", function() {
      renderOrdersTable(this.value);
    });
  }
}

// SECURE AUTH LOGOUT & INACTIVITY WATCHERS
let inactivityTimer;

function setupLogoutListener() {
  const btn = document.getElementById("admin-logout-btn");
  if (btn) {
    btn.addEventListener("click", function(e) {
      e.preventDefault();
      if (confirm("Are you sure you want to terminate your current Super Admin session?")) {
        const username = sessionStorage.getItem("coorg_admin_username") || "Super Admin";
        window.CoorgDB.logActivity(`Audit log: User '${username}' logged out manually.`);
        performLogout();
      }
    });
  }
}

function setupInactivityTimeout() {
  // Bind standard interaction events to reset timer
  window.addEventListener("mousemove", resetInactivityTimer);
  window.addEventListener("click", resetInactivityTimer);
  window.addEventListener("keypress", resetInactivityTimer);
  window.addEventListener("scroll", resetInactivityTimer);
  
  resetInactivityTimer();
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  // Auto logout after 30 minutes (30 * 60 * 1000 ms)
  inactivityTimer = setTimeout(autoLogout, 30 * 60 * 1000);
}

function autoLogout() {
  window.CoorgDB.logActivity("Security Alert: Automatic session logout triggered due to 30 minutes of inactivity.");
  performLogout();
}

function performLogout() {
  sessionStorage.removeItem("coorg_admin_logged_in");
  sessionStorage.removeItem("coorg_admin_username");
  window.location.replace("admin-login.html");
}

// PRODUCT IMAGE FILE UPLOAD HANDLER WITH BASE64 FALLBACK
function setupImageUploadListener() {
  const fileInput = document.getElementById("crud-image-file");
  const urlInput = document.getElementById("crud-image");
  const statusMsg = document.getElementById("upload-status-msg");

  if (!fileInput || !urlInput || !statusMsg) return;

  fileInput.addEventListener("change", async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Show loading indicator
    statusMsg.style.color = "var(--earth-brown || #2E5E3E)";
    statusMsg.textContent = "⌛ Uploading file to server...";

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      urlInput.value = data.url;
      statusMsg.style.color = "#2E5E3E"; // green
      statusMsg.textContent = "✅ Image uploaded successfully!";
      
      // Log audit trail
      await window.CoorgDB.logActivity(`Uploaded product image: ${file.name}`);
    } catch (err) {
      console.warn("Server uploader failed, falling back to Base64:", err.message);
      
      // Offline fallback: Read as Base64 Data URL
      const reader = new FileReader();
      reader.onload = function(evt) {
        urlInput.value = evt.target.result;
        statusMsg.style.color = "#C5A059"; // gold
        statusMsg.textContent = "⚡ Saved locally as Base64 (Server offline fallback).";
      };
      reader.readAsDataURL(file);
    }
  });
}

function resetUploadStatus() {
  const statusMsg = document.getElementById("upload-status-msg");
  if (statusMsg) {
    statusMsg.style.color = "var(--medium-gray)";
    statusMsg.textContent = "Provide a direct image URL or upload a local file.";
  }
  const fileInput = document.getElementById("crud-image-file");
  if (fileInput) fileInput.value = "";
}

// PRODUCT GALLERY IMAGES MANAGER
window.renderGalleryImages = function(imagesList) {
  const container = document.getElementById("gallery-images-list");
  if (!container) return;
  container.innerHTML = "";
  
  let list = [];
  try {
    if (imagesList) {
      list = typeof imagesList === 'string' ? JSON.parse(imagesList) : imagesList;
    }
  } catch (e) {
    console.error("Error parsing product gallery images:", e);
  }
  
  if (Array.isArray(list)) {
    list.forEach(url => {
      window.addGalleryImageSlot(url);
    });
  }
};

window.addGalleryImageSlot = function(value = "") {
  const container = document.getElementById("gallery-images-list");
  if (!container) return;
  
  const row = document.createElement("div");
  row.className = "gallery-image-row";
  row.style.display = "flex";
  row.style.gap = "10px";
  row.style.alignItems = "center";
  
  row.innerHTML = `
    <input type="text" class="form-control gallery-image-url" value="${value}" placeholder="images/uploads/product-image.jpg" style="flex: 1;">
    <label class="btn btn-secondary" style="margin: 0; padding: 10px 15px; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; font-size: 0.85rem; border-radius: 4px; border: 1px solid var(--light-gray);">
      <i class="fa-solid fa-cloud-arrow-up"></i> Upload
      <input type="file" accept="image/*" style="display: none;" onchange="window.handleGalleryFileUpload(this)">
    </label>
    <button type="button" class="btn btn-outline" style="padding: 10px; border-radius: 4px; border: 1px solid var(--light-gray); color: #B03232; cursor: pointer;" onclick="this.closest('.gallery-image-row').remove()">
      <i class="fa-solid fa-trash"></i>
    </button>
  `;
  container.appendChild(row);
};

window.handleGalleryFileUpload = async function(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;

  const row = fileInput.closest(".gallery-image-row");
  const urlInput = row.querySelector(".gallery-image-url");
  const uploadBtn = fileInput.closest("label");

  uploadBtn.style.pointerEvents = "none";
  uploadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading...`;

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();
    urlInput.value = data.url;
    uploadBtn.innerHTML = `<i class="fa-solid fa-check" style="color:#2E5E3E;"></i> Done`;
    
    // Log audit trail
    await window.CoorgDB.logActivity(`Uploaded product gallery image: ${file.name}`);
  } catch (err) {
    console.warn("Gallery server uploader failed, falling back to Base64:", err.message);
    
    const reader = new FileReader();
    reader.onload = function(evt) {
      urlInput.value = evt.target.result;
      uploadBtn.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="color:#C5A059;"></i> Offline`;
    };
    reader.readAsDataURL(file);
  } finally {
    setTimeout(() => {
      uploadBtn.style.pointerEvents = "auto";
      uploadBtn.innerHTML = `
        <i class="fa-solid fa-cloud-arrow-up"></i> Upload
        <input type="file" accept="image/*" style="display: none;" onchange="window.handleGalleryFileUpload(this)">
      `;
    }, 2000);
  }
};

// DYNAMIC CATEGORY DROPDOWN POPULATION FOR PRODUCT MODAL
function populateCategoryDropdown() {
  const select = document.getElementById("crud-category");
  if (!select) return;
  const categories = window.CoorgDB.getCategories();
  select.innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

// CATEGORIES CRUD CONTROLLER FUNCTIONS
window.renderCategoriesTable = function() {
  const tbody = document.getElementById("category-table-body");
  if (!tbody) return;

  const categories = window.CoorgDB.getCategories();
  if (categories.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--medium-gray);">No categories found. Create one.</td></tr>`;
    return;
  }

  tbody.innerHTML = categories.map(c => `
    <tr>
      <td><code>${c.id}</code></td>
      <td><strong>${c.name}</strong></td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" onclick="editCategoryHandler('${c.id}')" title="Edit Category Name"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="action-btn delete" onclick="deleteCategoryHandler('${c.id}')" title="Delete Category"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
};

window.handleSaveCategory = async function(e) {
  e.preventDefault();
  const id = document.getElementById("category-id").value;
  const name = document.getElementById("category-name").value.trim();

  if (!name) return;

  if (id) {
    // Edit existing category
    await window.CoorgDB.updateCategory(id, name);
  } else {
    // Add new category
    await window.CoorgDB.addCategory(name);
  }

  // Reset form and UI
  cancelCategoryEdit();
  renderCategoriesTable();
  renderProductsTable();
  loadAnalytics(); // Refresh item count metrics
};

window.editCategoryHandler = function(id) {
  const cat = window.CoorgDB.getCategories().find(c => c.id === id);
  if (!cat) return;

  document.getElementById("category-id").value = cat.id;
  document.getElementById("category-name").value = cat.name;
  document.getElementById("category-form-title").textContent = "Edit Category Name";
  document.getElementById("btn-save-category").innerHTML = `Update Category <i class="fa-solid fa-floppy-disk"></i>`;
  document.getElementById("btn-cancel-edit-category").style.display = "block";
};

window.deleteCategoryHandler = async function(id) {
  const cat = window.CoorgDB.getCategories().find(c => c.id === id);
  if (!cat) return;

  if (confirm(`Are you sure you want to delete category "${cat.name}"?\nAll products in this category will be changed to "Uncategorized".`)) {
    await window.CoorgDB.deleteCategory(id);
    renderCategoriesTable();
    renderProductsTable();
    loadAnalytics();
  }
};

window.cancelCategoryEdit = function() {
  document.getElementById("admin-category-form").reset();
  document.getElementById("category-id").value = "";
  document.getElementById("category-form-title").textContent = "Create New Category";
  document.getElementById("btn-save-category").innerHTML = `Create Category <i class="fa-solid fa-folder-plus"></i>`;
  document.getElementById("btn-cancel-edit-category").style.display = "none";
};

// ==========================================
// STORE SETTINGS CONTROLLERS & EVENT HANDLERS
// ==========================================

window.loadStoreSettings = function() {
  const settings = window.CoorgDB.getSettings() || {};

  // Company Legal & GST Profile
  const companyNameEl = document.getElementById("setting-company-name");
  if (companyNameEl) companyNameEl.value = settings.company_name || "Coorg Harvest";
  const proprietorEl = document.getElementById("setting-company-proprietor");
  if (proprietorEl) proprietorEl.value = settings.company_proprietor || "FAABID FAIZAL P M";
  const gstinEl = document.getElementById("setting-company-gstin");
  if (gstinEl) gstinEl.value = settings.company_gstin || "29IJLPM3578P1ZX";
  const stateCodeEl = document.getElementById("setting-company-state-code");
  if (stateCodeEl) stateCodeEl.value = settings.company_state_code || "29";
  const fssaiEl = document.getElementById("setting-company-fssai");
  if (fssaiEl) fssaiEl.value = settings.company_fssai || "21226110000154";
  const defaultGstEl = document.getElementById("setting-company-default-gst");
  if (defaultGstEl) defaultGstEl.value = settings.company_default_gst || "5.0";
  const addrEl = document.getElementById("setting-company-address");
  if (addrEl) addrEl.value = settings.company_address || "Bypass Road, Gonikopal, Kodagu - 571213, Karnataka";
  const phoneEl = document.getElementById("setting-company-phone");
  if (phoneEl) phoneEl.value = settings.company_phone || "+91 9880077218";
  const emailEl = document.getElementById("setting-company-email");
  if (emailEl) emailEl.value = settings.company_email || "info@coorgharvest.com";

  if (document.getElementById("setting-delivery-charge")) {
    document.getElementById("setting-delivery-charge").value = settings.delivery_charge || "50";
    document.getElementById("setting-free-delivery-threshold").value = settings.free_delivery_threshold || "500";
    document.getElementById("setting-cod-enabled").value = settings.cod_enabled || "true";
  }
  
  if (document.getElementById("setting-google-analytics-id")) {
    document.getElementById("setting-google-analytics-id").value = settings.google_analytics_id || "";
    document.getElementById("setting-google-merchant-id").value = settings.google_merchant_id || "";
    document.getElementById("setting-meta-pixel-id").value = settings.meta_pixel_id || "";
    document.getElementById("setting-meta-api-key").value = settings.meta_api_key || "";
    document.getElementById("setting-delivery-partner-api").value = settings.delivery_partner_api || "";
  }

  renderBannersManager(settings.homepage_banners);
};

window.saveCompanyGstSettings = async function(e) {
  if (e && e.preventDefault) e.preventDefault();
  const company_name = document.getElementById("setting-company-name")?.value.trim() || "Coorg Harvest";
  const company_proprietor = document.getElementById("setting-company-proprietor")?.value.trim() || "FAABID FAIZAL P M";
  const company_gstin = document.getElementById("setting-company-gstin")?.value.trim().toUpperCase() || "29IJLPM3578P1ZX";
  const company_state_code = document.getElementById("setting-company-state-code")?.value || "29";
  const company_fssai = document.getElementById("setting-company-fssai")?.value.trim() || "";
  const company_default_gst = document.getElementById("setting-company-default-gst")?.value || "5.0";
  const company_address = document.getElementById("setting-company-address")?.value.trim() || "Bypass Road, Gonikopal, Kodagu - 571213, Karnataka";
  const company_phone = document.getElementById("setting-company-phone")?.value.trim() || "+91 9880077218";
  const company_email = document.getElementById("setting-company-email")?.value.trim() || "info@coorgharvest.com";

  await window.CoorgDB.updateSettings({
    company_name,
    company_proprietor,
    company_gstin,
    company_state_code,
    company_fssai,
    company_default_gst,
    company_address,
    company_phone,
    company_email
  });
  alert("✅ Company Legal & GST Profile saved successfully!");
};

function renderBannersManager(bannersJson) {
  const container = document.getElementById("banners-manager-container");
  if (!container) return;

  let banners = [];
  try {
    if (bannersJson) {
      banners = typeof bannersJson === 'string' ? JSON.parse(bannersJson) : bannersJson;
    }
  } catch (e) {
    console.error("Error parsing banners in admin:", e);
  }

  // Fallback default banners if none configured yet
  if (!banners || banners.length === 0) {
    banners = [
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
    ];
  }

  container.innerHTML = banners.map((slide, index) => `
    <div class="banner-slide-item" style="border: 1px solid var(--light-gray); padding: 15px; border-radius: 6px; background-color: var(--white);">
      <h4 style="margin-bottom:10px; color:var(--primary-green); display:flex; justify-content:space-between;">
        <span>Slide ${index + 1}</span>
        <span style="font-size:0.75rem; color:var(--medium-gray);">Index: ${index}</span>
      </h4>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div class="form-group" style="margin-bottom:0;">
          <label style="font-size:0.75rem; margin-bottom:2px;">Slide Title</label>
          <input type="text" class="form-control banner-title" value="${slide.title || ''}" placeholder="Banner Title" required style="font-size:0.85rem; padding:6px 10px;">
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label style="font-size:0.75rem; margin-bottom:2px;">Slide Subtitle</label>
          <textarea class="form-control banner-subtitle" rows="2" placeholder="Banner Subtitle" required style="font-size:0.85rem; padding:6px 10px;">${slide.subtitle || ''}</textarea>
        </div>
        <div class="form-row-2" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:0;">
          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:0.75rem; margin-bottom:2px;">Button Text</label>
            <input type="text" class="form-control banner-link-text" value="${slide.linkText || ''}" placeholder="Shop Now" required style="font-size:0.85rem; padding:6px 10px;">
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:0.75rem; margin-bottom:2px;">Button Link</label>
            <input type="text" class="form-control banner-link" value="${slide.link || ''}" placeholder="shop.html" style="font-size:0.85rem; padding:6px 10px;">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label style="font-size:0.75rem; margin-bottom:2px;">Image URL / Path</label>
          <input type="text" class="form-control banner-image" value="${slide.image || ''}" placeholder="images/uploads/slide.jpg" required style="font-size:0.85rem; padding:6px 10px;">
        </div>
      </div>
    </div>
  `).join('');
}

window.saveShippingSettings = async function(e) {
  e.preventDefault();
  const delivery_charge = document.getElementById("setting-delivery-charge").value;
  const free_delivery_threshold = document.getElementById("setting-free-delivery-threshold").value;
  const cod_enabled = document.getElementById("setting-cod-enabled").value;

  await window.CoorgDB.updateSettings({ delivery_charge, free_delivery_threshold, cod_enabled });
  alert("✅ Delivery and COD settings saved successfully!");
};

window.saveIntegrationSettings = async function(e) {
  e.preventDefault();
  const google_analytics_id = document.getElementById("setting-google-analytics-id").value;
  const google_merchant_id = document.getElementById("setting-google-merchant-id").value;
  const meta_pixel_id = document.getElementById("setting-meta-pixel-id").value;
  const meta_api_key = document.getElementById("setting-meta-api-key").value;
  const delivery_partner_api = document.getElementById("setting-delivery-partner-api").value;

  await window.CoorgDB.updateSettings({
    google_analytics_id,
    google_merchant_id,
    meta_pixel_id,
    meta_api_key,
    delivery_partner_api
  });
  alert("✅ SEO and API integration settings saved successfully!");
};

window.saveBannersSettings = async function() {
  const items = document.querySelectorAll(".banner-slide-item");
  const banners = [];

  for (const item of items) {
    const title = item.querySelector(".banner-title").value.trim();
    const subtitle = item.querySelector(".banner-subtitle").value.trim();
    const linkText = item.querySelector(".banner-link-text").value.trim();
    const link = item.querySelector(".banner-link").value.trim();
    const image = item.querySelector(".banner-image").value.trim();

    if (!title || !subtitle || !image) {
      alert("⚠️ Please fill out all required slide details.");
      return;
    }

    banners.push({ title, subtitle, linkText, link, image });
  }

  await window.CoorgDB.updateSettings({ homepage_banners: JSON.stringify(banners) });
  alert("✅ Homepage banners saved successfully!");
}

// ==========================================
// MANUAL ORDER CONTROLLERS & EVENT HANDLERS
// ==========================================

let manualOrderItems = [];
let manualOrderAppliedCoupon = null;

window.handleManualChannelChange = function() {
  const channel = document.getElementById("manual-order-channel")?.value || "Store";
  const deliveryInput = document.getElementById("manual-delivery-cost");
  const commissionInput = document.getElementById("manual-commission");
  const packingInput = document.getElementById("manual-packing-cost");
  const paymentSelect = document.getElementById("manual-payment-method");
  const statusSelect = document.getElementById("manual-order-status");

  if (channel === "Store") {
    if (deliveryInput) deliveryInput.value = "0";
    if (commissionInput) commissionInput.value = "0";
    if (packingInput) packingInput.value = "5";
    if (paymentSelect) paymentSelect.value = "UPI";
    if (statusSelect) statusSelect.value = "Delivered";
  } else if (channel === "Amazon") {
    if (deliveryInput) deliveryInput.value = "65";
    if (commissionInput) commissionInput.value = "50";
    if (packingInput) packingInput.value = "15";
    if (paymentSelect) paymentSelect.value = "CARD";
    if (statusSelect) statusSelect.value = "Paid";
  } else if (channel === "Meesho") {
    if (deliveryInput) deliveryInput.value = "55";
    if (commissionInput) commissionInput.value = "0";
    if (packingInput) packingInput.value = "15";
    if (paymentSelect) paymentSelect.value = "CARD";
    if (statusSelect) statusSelect.value = "Paid";
  } else if (channel === "Flipkart") {
    if (deliveryInput) deliveryInput.value = "65";
    if (commissionInput) commissionInput.value = "45";
    if (packingInput) packingInput.value = "15";
    if (paymentSelect) paymentSelect.value = "CARD";
    if (statusSelect) statusSelect.value = "Paid";
  } else if (channel === "WhatsApp" || channel === "Instagram") {
    if (deliveryInput) deliveryInput.value = "50";
    if (commissionInput) commissionInput.value = "0";
    if (packingInput) packingInput.value = "15";
    if (paymentSelect) paymentSelect.value = "UPI";
    if (statusSelect) statusSelect.value = "Paid";
  } else if (channel === "Phone") {
    if (deliveryInput) deliveryInput.value = "50";
    if (commissionInput) commissionInput.value = "0";
    if (packingInput) packingInput.value = "15";
    if (paymentSelect) paymentSelect.value = "COD";
    if (statusSelect) statusSelect.value = "Pending COD";
  } else {
    // Website Direct
    if (deliveryInput) deliveryInput.value = "50";
    if (commissionInput) commissionInput.value = "0";
    if (packingInput) packingInput.value = "15";
    if (paymentSelect) paymentSelect.value = "COD";
    if (statusSelect) statusSelect.value = "Pending COD";
  }

  window.toggleManualCodDepositRow();
  recalculateManualOrderTotals();
};

window.openManualOrderModal = function() {
  manualOrderItems = [];
  manualOrderAppliedCoupon = null;
  
  // Reset form inputs
  const form = document.getElementById("manual-order-form");
  if (form) form.reset();
  
  // Hide coupon discount row
  const rowDiscount = document.getElementById("manual-row-discount");
  if (rowDiscount) rowDiscount.style.display = "none";
  
  // Set default discount state
  const discType = document.getElementById("manual-discount-type");
  if (discType) discType.value = "none";
  const discVal = document.getElementById("manual-discount-value");
  if (discVal) discVal.value = "";
  window.toggleManualDiscountFields();
  
  // Populate products select with Cost Price and GST Rate
  const productSelect = document.getElementById("manual-product-select");
  if (productSelect) {
    const products = window.CoorgDB.getProducts();
    const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));
    productSelect.innerHTML = sortedProducts.map(p => {
      const cp = parseFloat(p.costPrice) || Math.round(p.price * 0.5);
      const gst = parseFloat(p.gstRate) || 5.0;
      return `<option value="${p.id}" data-price="${p.price}" data-cost="${cp}" data-gst="${gst}" data-name="${p.name}" data-category="${p.category}">${p.name} - ₹${p.price} (${p.stock} in stock)</option>`;
    }).join('');
  }
  
  // Preset Store / Walk-in as default channel
  const chSelect = document.getElementById("manual-order-channel");
  if (chSelect) chSelect.value = "Store";
  window.handleManualChannelChange();
  
  // Render empty items list & recalculate
  renderManualOrderItemsList();
  recalculateManualOrderTotals();
  
  // Open modal overlay
  document.getElementById("manual-order-modal-overlay").classList.add("active");
};

window.toggleManualCodDepositRow = function() {
  const method = document.getElementById("manual-payment-method")?.value || "";
  const depositGroup = document.getElementById("manual-cod-deposit-group");
  if (depositGroup) {
    if (method === "COD") {
      depositGroup.style.display = "flex";
    } else {
      depositGroup.style.display = "none";
      const chk = document.getElementById("manual-cod-deposit");
      if (chk) chk.checked = false;
    }
  }
};

window.toggleManualDiscountFields = function() {
  const type = document.getElementById("manual-discount-type")?.value || "none";
  const couponRow = document.getElementById("manual-coupon-row");
  const valGroup = document.getElementById("manual-discount-val-group");
  const valLabel = document.getElementById("manual-discount-val-label");
  
  if (type === "coupon") {
    if (couponRow) couponRow.style.display = "flex";
    if (valGroup) valGroup.style.display = "none";
  } else if (type === "none") {
    if (couponRow) couponRow.style.display = "none";
    if (valGroup) valGroup.style.display = "none";
    const discVal = document.getElementById("manual-discount-value");
    if (discVal) discVal.value = "";
  } else {
    if (couponRow) couponRow.style.display = "none";
    if (valGroup) valGroup.style.display = "block";
    if (valLabel) valLabel.textContent = type === "percent" ? "Percentage (%)" : "Flat Amount (₹)";
  }
};

window.closeManualOrderModal = function() {
  document.getElementById("manual-order-modal-overlay").classList.remove("active");
};

window.addManualOrderItem = function() {
  const select = document.getElementById("manual-product-select");
  if (!select || select.options.length === 0) return;
  
  const selectedOption = select.options[select.selectedIndex];
  const productId = selectedOption.value;
  const name = selectedOption.getAttribute("data-name");
  const price = parseFloat(selectedOption.getAttribute("data-price"));
  const costPrice = parseFloat(selectedOption.getAttribute("data-cost")) || 0;
  const gstRate = parseFloat(selectedOption.getAttribute("data-gst")) || 5.0;
  const category = selectedOption.getAttribute("data-category");
  
  const existingItem = manualOrderItems.find(item => item.id === productId);
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    manualOrderItems.push({
      id: productId,
      name: name,
      price: price,
      costPrice: costPrice,
      gstRate: gstRate,
      category: category,
      qty: 1
    });
  }
  
  renderManualOrderItemsList();
  recalculateManualOrderTotals();
};

window.removeManualOrderItem = function(productId) {
  manualOrderItems = manualOrderItems.filter(item => item.id !== productId);
  renderManualOrderItemsList();
  recalculateManualOrderTotals();
};

window.updateManualOrderQty = function(productId, qty) {
  const qtyNum = parseInt(qty);
  if (isNaN(qtyNum) || qtyNum <= 0) {
    window.removeManualOrderItem(productId);
    return;
  }
  
  const item = manualOrderItems.find(item => item.id === productId);
  if (item) {
    item.qty = qtyNum;
  }
  
  renderManualOrderItemsList();
  recalculateManualOrderTotals();
};

window.updateManualOrderQtyStepper = function(productId, delta) {
  const item = manualOrderItems.find(item => item.id === productId);
  if (!item) return;
  const newQty = item.qty + delta;
  if (newQty <= 0) {
    window.removeManualOrderItem(productId);
  } else {
    item.qty = newQty;
    renderManualOrderItemsList();
    recalculateManualOrderTotals();
  }
};

window.applyManualOrderCoupon = function() {
  const codeInput = document.getElementById("manual-coupon-code");
  if (!codeInput) return;
  
  const code = codeInput.value.trim();
  if (!code) {
    alert("Please enter a coupon code.");
    return;
  }
  
  const coupon = window.CoorgDB.validateCoupon(code);
  if (!coupon) {
    alert("Invalid coupon code.");
    manualOrderAppliedCoupon = null;
    const rowDisc = document.getElementById("manual-row-discount");
    if (rowDisc) rowDisc.style.display = "none";
    recalculateManualOrderTotals();
    return;
  }
  
  manualOrderAppliedCoupon = coupon;
  alert(`Coupon Applied: ${coupon.description}`);
  recalculateManualOrderTotals();
};

function renderManualOrderItemsList() {
  const listContainer = document.getElementById("manual-items-list");
  if (!listContainer) return;
  
  if (manualOrderItems.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align:center; color:var(--medium-gray); padding:24px 15px; font-size:0.85rem;">
        <i class="fa-solid fa-basket-shopping" style="font-size:1.6rem; opacity:0.35; margin-bottom:8px; display:block;"></i>
        Select a product from the dropdown above and click <strong>Add +</strong>
      </div>`;
    return;
  }
  
  listContainer.innerHTML = manualOrderItems.map(item => {
    const cp = parseFloat(item.costPrice) || 0;
    const lineTotal = item.price * item.qty;
    const lineProfit = (item.price - cp) * item.qty;
    const gstRate = item.gstRate || 5.0;

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #e2e8f0; background:white; border-radius:6px; margin-bottom:6px; gap:10px;">
        <div style="flex:1; min-width:0;">
          <div style="font-weight:600; color:var(--primary-green); font-size:0.88rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${item.name}
          </div>
          <div style="font-size:0.75rem; color:#64748b; margin-top:2px; display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
            <span>Sale: <strong>₹${item.price}</strong></span>
            <span>•</span>
            <span>Cost: ₹${cp.toFixed(0)}</span>
            <span style="background:#e0f2fe; color:#0369a1; padding:1px 5px; border-radius:3px; font-weight:600; font-size:0.7rem;">${gstRate}% GST</span>
            <span style="color:#16a34a; font-weight:600;">(Margin: +₹${lineProfit.toFixed(0)})</span>
          </div>
        </div>
        
        <div style="display:flex; align-items:center; gap:8px;">
          <!-- Quantity Stepper Controls -->
          <div style="display:flex; align-items:center; border:1px solid #cbd5e1; border-radius:4px; overflow:hidden; background:#f8fafc;">
            <button type="button" onclick="updateManualOrderQtyStepper('${item.id}', -1)" style="border:none; background:transparent; width:28px; height:30px; font-weight:bold; cursor:pointer; font-size:0.9rem; color:#475569;" title="Decrease">-</button>
            <input type="number" value="${item.qty}" min="1" onchange="updateManualOrderQty('${item.id}', this.value)" style="width:38px; height:30px; border:none; border-left:1px solid #cbd5e1; border-right:1px solid #cbd5e1; text-align:center; font-weight:600; font-size:0.85rem; padding:0; background:white;">
            <button type="button" onclick="updateManualOrderQtyStepper('${item.id}', 1)" style="border:none; background:transparent; width:28px; height:30px; font-weight:bold; cursor:pointer; font-size:0.9rem; color:#475569;" title="Increase">+</button>
          </div>

          <div style="text-align:right; min-width:65px;">
            <strong style="color:var(--dark-text); font-size:0.9rem;">₹${lineTotal.toFixed(2)}</strong>
          </div>

          <button type="button" onclick="removeManualOrderItem('${item.id}')" style="background:#fee2e2; border:none; color:#dc2626; cursor:pointer; padding:6px 8px; border-radius:4px; font-size:0.8rem;" title="Remove Item">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function recalculateManualOrderTotals() {
  const rowDiscount = document.getElementById("manual-row-discount");
  const labelDiscount = document.getElementById("manual-lbl-discount");
  const gstLbl = document.getElementById("manual-lbl-gst-breakdown");
  const profitLbl = document.getElementById("manual-lbl-net-profit");

  // Guard against empty items list: reset to 0 to prevent negative net profit bug
  if (manualOrderItems.length === 0) {
    document.getElementById("manual-lbl-subtotal").textContent = "₹0.00";
    if (rowDiscount) rowDiscount.style.display = "none";
    if (labelDiscount) labelDiscount.textContent = "-₹0.00";
    document.getElementById("manual-lbl-shipping").textContent = "₹0.00";
    document.getElementById("manual-lbl-total").textContent = "₹0.00";
    if (gstLbl) gstLbl.textContent = "₹0.00 (₹0.00 GST)";
    if (profitLbl) {
      profitLbl.textContent = "₹0.00 (0.0%)";
      profitLbl.style.color = "#16a34a";
    }
    return;
  }

  const subtotal = manualOrderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  // Calculate discount
  let discount = 0;
  const discountType = document.getElementById("manual-discount-type")?.value || "none";
  const discountVal = parseFloat(document.getElementById("manual-discount-value")?.value) || 0;
  
  if (discountType === "percent") {
    discount = subtotal * (discountVal / 100);
    if (rowDiscount) {
      rowDiscount.style.display = "flex";
      rowDiscount.querySelector("span").textContent = `Manual Discount (${discountVal}%):`;
    }
  } else if (discountType === "fixed") {
    discount = discountVal;
    if (rowDiscount) {
      rowDiscount.style.display = "flex";
      rowDiscount.querySelector("span").textContent = "Manual Discount:";
    }
  } else if (discountType === "coupon" && manualOrderAppliedCoupon) {
    if (rowDiscount) {
      rowDiscount.style.display = "flex";
      rowDiscount.querySelector("span").textContent = "Coupon Discount:";
    }
    if (manualOrderAppliedCoupon.type === "percent") {
      discount = subtotal * (parseFloat(manualOrderAppliedCoupon.value) / 100);
    } else if (manualOrderAppliedCoupon.type === "fixed") {
      discount = parseFloat(manualOrderAppliedCoupon.value);
    }
  } else {
    if (rowDiscount) rowDiscount.style.display = "none";
  }
  
  discount = Math.min(discount, subtotal);
  
  // Shipping logic
  const channel = document.getElementById("manual-order-channel")?.value || "Store";
  let shipping = 0;
  if (channel !== "Store") {
    const settings = window.CoorgDB.getSettings() || {};
    const deliveryCharge = parseFloat(settings.delivery_charge || "50");
    const freeThreshold = parseFloat(settings.free_delivery_threshold || "500");
    shipping = subtotal >= freeThreshold ? 0 : deliveryCharge;
  }
  
  const total = Math.max(0, subtotal - discount + shipping);
  
  // Update UI Labels
  document.getElementById("manual-lbl-subtotal").textContent = `₹${subtotal.toFixed(2)}`;
  if (labelDiscount) labelDiscount.textContent = `-₹${discount.toFixed(2)}`;
  document.getElementById("manual-lbl-shipping").textContent = shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`;
  document.getElementById("manual-lbl-total").textContent = `₹${total.toFixed(2)}`;

  // Itemized GST & Taxable Amount Calculation
  let totalTaxable = 0;
  let totalGst = 0;
  manualOrderItems.forEach(item => {
    const itemSubtotal = item.price * item.qty;
    const itemDiscount = subtotal > 0 ? (itemSubtotal / subtotal) * discount : 0;
    const itemNet = Math.max(0, itemSubtotal - itemDiscount);
    const itemGstRate = parseFloat(item.gstRate) || 5.0;
    const itemTaxable = itemNet / (1 + (itemGstRate / 100));
    totalTaxable += itemTaxable;
    totalGst += (itemNet - itemTaxable);
  });

  if (gstLbl) {
    gstLbl.textContent = `₹${totalTaxable.toFixed(2)} (₹${totalGst.toFixed(2)} GST)`;
  }

  // Cost of Goods Sold & Expenses
  const cogs = manualOrderItems.reduce((sum, item) => {
    const prod = window.CoorgDB.getProductById(item.id);
    const cp = prod && prod.costPrice !== undefined ? parseFloat(prod.costPrice) : (parseFloat(item.costPrice) || 0);
    return sum + (cp * item.qty);
  }, 0);

  const deliveryCostInput = document.getElementById("manual-delivery-cost");
  const deliveryCost = deliveryCostInput && deliveryCostInput.value !== "" 
    ? parseFloat(deliveryCostInput.value) 
    : (shipping > 0 ? shipping : (channel === "Store" ? 0 : 50));

  const commission = parseFloat(document.getElementById("manual-commission")?.value) || 0;
  const packingCost = parseFloat(document.getElementById("manual-packing-cost")?.value) || (channel === "Store" ? 5 : 15);
  const otherExpense = parseFloat(document.getElementById("manual-other-expense")?.value) || 0;

  const netProfit = total - (cogs + deliveryCost + commission + packingCost + otherExpense);
  const marginPct = total > 0 ? ((netProfit / total) * 100).toFixed(1) : "0.0";

  if (profitLbl) {
    profitLbl.textContent = `₹${netProfit.toFixed(2)} (${marginPct}%)`;
    profitLbl.style.color = netProfit >= 0 ? "#1b5e20" : "var(--red)";
  }
}

window.recalculateManualOrderTotals = recalculateManualOrderTotals;

window.saveManualOrder = async function() {
  const name = document.getElementById("manual-cust-name").value.trim();
  const phone = document.getElementById("manual-cust-phone").value.trim();
  const email = document.getElementById("manual-cust-email").value.trim();
  const address = document.getElementById("manual-cust-address").value.trim();
  const channel = document.getElementById("manual-order-channel")?.value || "Store";
  const customerGstin = document.getElementById("manual-cust-gstin")?.value.trim().toUpperCase() || null;
  
  if (!name || !phone || !address) {
    alert("Please fill out all required customer detail fields.");
    return;
  }
  
  if (manualOrderItems.length === 0) {
    alert("Please add at least one product to the order.");
    return;
  }
  
  // Compute totals
  const subtotal = manualOrderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  let discount = 0;
  const discountType = document.getElementById("manual-discount-type").value;
  const discountVal = parseFloat(document.getElementById("manual-discount-value").value) || 0;
  
  if (discountType === "percent") {
    discount = subtotal * (discountVal / 100);
  } else if (discountType === "fixed") {
    discount = discountVal;
  } else if (discountType === "coupon" && manualOrderAppliedCoupon) {
    if (manualOrderAppliedCoupon.type === "percent") {
      discount = subtotal * (parseFloat(manualOrderAppliedCoupon.value) / 100);
    } else if (manualOrderAppliedCoupon.type === "fixed") {
      discount = parseFloat(manualOrderAppliedCoupon.value);
    }
  }
  discount = Math.min(discount, subtotal);
  
  let shipping = 0;
  if (channel !== "Store") {
    const settings = window.CoorgDB.getSettings() || {};
    const deliveryCharge = parseFloat(settings.delivery_charge || "50");
    const freeThreshold = parseFloat(settings.free_delivery_threshold || "500");
    shipping = subtotal >= freeThreshold ? 0 : deliveryCharge;
  }
  const total = Math.max(0, subtotal - discount + shipping);
  
  const paymentMethod = document.getElementById("manual-payment-method").value;
  const status = document.getElementById("manual-order-status").value;

  // Unit Costs & Profitability
  const costPrice = manualOrderItems.reduce((sum, item) => {
    const prod = window.CoorgDB.getProductById(item.id);
    const cp = prod && prod.costPrice !== undefined ? parseFloat(prod.costPrice) : (parseFloat(item.costPrice) || 0);
    return sum + (cp * item.qty);
  }, 0);

  const deliveryCost = parseFloat(document.getElementById("manual-delivery-cost")?.value) || 0;
  const commission = parseFloat(document.getElementById("manual-commission")?.value) || 0;
  const packingCost = parseFloat(document.getElementById("manual-packing-cost")?.value) || (channel === "Store" ? 5 : 15);
  const otherExpense = parseFloat(document.getElementById("manual-other-expense")?.value) || 0;
  const netProfit = total - (costPrice + deliveryCost + commission + packingCost + otherExpense);

  // Accurate GST breakdown
  let taxableAmount = 0;
  let taxAmount = 0;
  manualOrderItems.forEach(item => {
    const itemSubtotal = item.price * item.qty;
    const itemDiscount = subtotal > 0 ? (itemSubtotal / subtotal) * discount : 0;
    const itemNet = Math.max(0, itemSubtotal - itemDiscount);
    const itemGstRate = parseFloat(item.gstRate) || 5.0;
    const itemTaxable = itemNet / (1 + (itemGstRate / 100));
    taxableAmount += itemTaxable;
    taxAmount += (itemNet - itemTaxable);
  });
  taxableAmount = parseFloat(taxableAmount.toFixed(2));
  taxAmount = parseFloat(taxAmount.toFixed(2));

  let cgst = 0, sgst = 0, igst = 0;
  if (customerGstin && !customerGstin.startsWith("29")) {
    igst = taxAmount;
  } else {
    cgst = parseFloat((taxAmount / 2).toFixed(2));
    sgst = parseFloat((taxAmount - cgst).toFixed(2));
  }
  
  // Format order date
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  const dateFormatted = `${year}-${month}-${day}, ${hoursStr}:${minutes} ${ampm}`;
  
  const orderId = `CH-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const orderDetails = {
    id: orderId,
    date: dateFormatted,
    name: name,
    phone: phone,
    email: email || "",
    address: address,
    items: manualOrderItems,
    subtotal: subtotal,
    discount: discount,
    shipping: shipping,
    total: total,
    paymentMethod: paymentMethod,
    status: status,
    trackingId: "",
    couponCode: discountType === "coupon" && manualOrderAppliedCoupon ? manualOrderAppliedCoupon.code : (discountType !== "none" ? "MANUAL" : null),
    codDeposit: (paymentMethod.toUpperCase() === 'COD' && document.getElementById("manual-cod-deposit")?.checked) ? 50 : 0,
    channel: channel,
    costPrice: costPrice,
    deliveryCost: deliveryCost,
    commission: commission,
    packingCost: packingCost,
    otherExpense: otherExpense,
    netProfit: netProfit,
    customerGstin: customerGstin,
    gstRate: 5.0,
    taxableAmount: taxableAmount,
    cgst: cgst,
    sgst: sgst,
    igst: igst,
    isReturned: 0,
    returnCost: 0,
    returnLoss: 0,
    metaData: {}
  };
  
  try {
    await window.CoorgDB.placeOrder(orderDetails);
    
    // Download tax invoice and delivery slip
    await window.adminDownloadInvoice(orderId);
    await window.adminDownloadDeliverySlip(orderId);
    
    alert(`🎉 Order ${orderId} (${channel}) placed successfully! Invoice and delivery slip downloaded.`);
    
    closeManualOrderModal();
    renderOrdersTable();
    if (typeof renderInventoryView === 'function') renderInventoryView();
    if (typeof renderProductsTable === 'function') renderProductsTable();
    loadAnalytics();
    renderActivityLogsList();
  } catch (err) {
    console.error("Failed to save manual order:", err);
    alert("Failed to place order. Please check the console logs.");
  }
};

// ==========================================
// 10. PURCHASES & INWARD BILLS CONTROLLER
// ==========================================
let purchaseItemRows = [];

function renderPurchasesTable(filterText = "") {
  const tbody = document.getElementById("purchase-table-body");
  if (!tbody) return;

  const purchases = window.CoorgDB.getPurchases();
  const searchInput = document.getElementById("purchase-table-search");
  const query = (filterText || (searchInput ? searchInput.value : "")).toLowerCase();

  const filtered = purchases.filter(p => 
    (p.invoiceNo && p.invoiceNo.toLowerCase().includes(query)) ||
    (p.vendorName && p.vendorName.toLowerCase().includes(query)) ||
    (p.vendorPhone && p.vendorPhone.toLowerCase().includes(query)) ||
    (p.vendorGstin && p.vendorGstin.toLowerCase().includes(query))
  );

  // Compute Purchase Metrics
  const totalPurchases = purchases.reduce((s, p) => s + (parseFloat(p.totalAmount) || 0), 0);
  const totalTax = purchases.reduce((s, p) => s + (parseFloat(p.taxAmount) || 0), 0);
  const vendors = new Set(purchases.map(p => p.vendorName.trim())).size;

  const statTotal = document.getElementById("stat-purchases-total");
  const statTax = document.getElementById("stat-purchases-tax");
  const statCount = document.getElementById("stat-purchases-count");
  const statVendors = document.getElementById("stat-purchases-vendors");

  if (statTotal) statTotal.textContent = `₹${totalPurchases.toFixed(2)}`;
  if (statTax) statTax.textContent = `₹${totalTax.toFixed(2)}`;
  if (statCount) statCount.textContent = purchases.length;
  if (statVendors) statVendors.textContent = vendors;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--medium-gray);">No purchase bills found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const items = Array.isArray(p.items) ? p.items : [];
    const itemsSummary = items.map(i => `${i.productName || 'Item'} (${i.qty})`).join(', ') || 'No items';

    return `
      <tr>
        <td data-label="Invoice No" style="font-weight:600; color:var(--primary-green); font-size:0.9rem;">
          ${p.invoiceNo}
          <div style="font-size:0.75rem; color:var(--medium-gray); font-weight:normal;">ID: ${p.id}</div>
        </td>
        <td data-label="Vendor">
          <strong>${p.vendorName}</strong>
          ${p.vendorGstin ? `<br><small style="color:#666;">GSTIN: ${p.vendorGstin}</small>` : ''}
          ${p.vendorPhone ? `<br><small style="color:var(--medium-gray);">${p.vendorPhone}</small>` : ''}
        </td>
        <td data-label="Date" style="font-size:0.85rem;">${p.date}</td>
        <td data-label="Items" style="font-size:0.8rem; max-width:200px;">${itemsSummary}</td>
        <td data-label="Taxable" style="font-size:0.85rem;">₹${(parseFloat(p.subtotal) || 0).toFixed(2)}</td>
        <td data-label="GST" style="color:var(--accent-gold); font-weight:600; font-size:0.85rem;">₹${(parseFloat(p.taxAmount) || 0).toFixed(2)}</td>
        <td data-label="Total" style="font-weight:700; font-size:0.95rem; color:var(--primary-green);">₹${(parseFloat(p.totalAmount) || 0).toFixed(2)}</td>
        <td data-label="Payment">
          <span style="display:inline-block; font-size:0.75rem; padding:3px 7px; border-radius:3px; font-weight:600; background:${p.paymentStatus === 'Paid' ? '#e8f5e9' : '#fff3e0'}; color:${p.paymentStatus === 'Paid' ? '#1b5e20' : '#e65100'};">
            ${p.paymentStatus || 'Paid'}
          </span>
          <div style="font-size:0.7rem; color:var(--medium-gray); margin-top:2px;">${p.paymentMethod || 'Bank'}</div>
        </td>
        <td data-label="Actions">
          <button class="action-btn delete" onclick="deletePurchaseBill('${p.id}')" title="Delete Purchase Bill" style="padding:5px 8px;">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.openAddPurchaseModal = function() {
  document.getElementById("purchase-bill-form").reset();
  document.getElementById("purchase-date").value = new Date().toISOString().split('T')[0];
  const otherExpEl = document.getElementById("purchase-other-expenses");
  if (otherExpEl) otherExpEl.value = "0";
  
  purchaseItemRows = [];
  addPurchaseItemRow(); // start with one blank row
  
  document.getElementById("purchase-modal-overlay").classList.add("active");
};

window.closePurchaseModal = function() {
  document.getElementById("purchase-modal-overlay").classList.remove("active");
};

window.addPurchaseItemRow = function(productId = "", qty = 10, unitCost = 0, gstRate = 5, gstType = "exclusive") {
  const products = window.CoorgDB.getProducts();
  const rowId = `pur_row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  const productOptions = products.map(p => 
    `<option value="${p.id}" ${p.id === productId ? 'selected' : ''} data-cost="${p.costPrice || 0}">${p.name} (Stock: ${p.stock})</option>`
  ).join('');

  const rowHtml = `
    <tr id="${rowId}">
      <td style="min-width: 220px;">
        <div style="display:flex; flex-direction:column; gap:4px;">
          <div style="display:flex; gap:4px; align-items:center;">
            <select class="form-control pur-item-prod" style="padding:4px 6px; font-size:0.8rem; flex:1;" onchange="onPurchaseProdChange('${rowId}')">
              <option value="">-- Select Product --</option>
              <option value="__CUSTOM_NEW__" style="color:var(--primary-green); font-weight:700;">➕ Type New / Custom Product...</option>
              ${productOptions}
            </select>
            <button type="button" class="btn btn-secondary" onclick="toggleCustomPurchaseProd('${rowId}')" title="Type custom product name directly" style="padding:4px 8px; font-size:0.75rem; white-space:nowrap; border:1px solid #c4d7c7;" id="btn-custom-${rowId}">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
          </div>
          <input type="text" class="form-control pur-item-custom-name" placeholder="Type new product name..." style="display:none; padding:4px 8px; font-size:0.8rem; border-color:var(--primary-green); background:#f4fbf6;" oninput="recalculatePurchaseTotals()">
        </div>
      </td>
      <td>
        <input type="text" class="form-control pur-item-hsn" value="0904" style="padding:4px; font-size:0.8rem; width:65px;">
      </td>
      <td>
        <input type="number" class="form-control pur-item-qty" min="1" value="${qty}" style="padding:4px; font-size:0.8rem; width:70px;" oninput="recalculatePurchaseTotals()">
      </td>
      <td>
        <input type="number" class="form-control pur-item-cost" min="0" step="0.01" value="${unitCost}" style="padding:4px; font-size:0.8rem; width:95px;" oninput="recalculatePurchaseTotals()">
      </td>
      <td>
        <select class="form-control pur-item-gst-type" style="padding:4px; font-size:0.75rem; width:115px;" onchange="recalculatePurchaseTotals()">
          <option value="exclusive" ${gstType === 'exclusive' ? 'selected' : ''}>Exclusive (+Tax)</option>
          <option value="inclusive" ${gstType === 'inclusive' ? 'selected' : ''}>Inclusive (Inc. Tax)</option>
        </select>
      </td>
      <td>
        <select class="form-control pur-item-gst" style="padding:4px; font-size:0.8rem; width:75px;" onchange="recalculatePurchaseTotals()">
          <option value="0" ${gstRate === 0 ? 'selected' : ''}>0%</option>
          <option value="5" ${gstRate === 5 ? 'selected' : ''}>5%</option>
          <option value="12" ${gstRate === 12 ? 'selected' : ''}>12%</option>
          <option value="18" ${gstRate === 18 ? 'selected' : ''}>18%</option>
        </select>
      </td>
      <td class="pur-item-taxable" style="font-weight:600;">₹0.00</td>
      <td class="pur-item-tax" style="color:var(--accent-gold);">₹0.00</td>
      <td class="pur-item-total" style="font-weight:700; color:var(--primary-green);">₹0.00</td>
      <td>
        <button type="button" onclick="removePurchaseItemRow('${rowId}')" style="background:none; border:none; color:var(--red); cursor:pointer;">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `;

  document.getElementById("purchase-items-table-body").insertAdjacentHTML("beforeend", rowHtml);
  recalculatePurchaseTotals();
};

window.toggleCustomPurchaseProd = function(rowId) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const customInput = row.querySelector(".pur-item-custom-name");
  const select = row.querySelector(".pur-item-prod");
  const btn = row.querySelector(`#btn-custom-${rowId}`);

  if (customInput.style.display === "none") {
    customInput.style.display = "block";
    select.value = "__CUSTOM_NEW__";
    customInput.focus();
    if (btn) btn.classList.add("btn-primary");
  } else {
    customInput.style.display = "none";
    if (select.value === "__CUSTOM_NEW__") select.value = "";
    if (btn) btn.classList.remove("btn-primary");
  }
};

window.onPurchaseProdChange = function(rowId) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const select = row.querySelector(".pur-item-prod");
  const customInput = row.querySelector(".pur-item-custom-name");
  const btn = row.querySelector(`#btn-custom-${rowId}`);

  if (select.value === "__CUSTOM_NEW__") {
    customInput.style.display = "block";
    customInput.focus();
    if (btn) btn.classList.add("btn-primary");
  } else {
    customInput.style.display = "none";
    if (btn) btn.classList.remove("btn-primary");
    const selectedOption = select.options[select.selectedIndex];
    const cost = selectedOption?.getAttribute("data-cost") || 0;
    
    if (parseFloat(cost) > 0) {
      row.querySelector(".pur-item-cost").value = cost;
    }
  }
  recalculatePurchaseTotals();
};

window.removePurchaseItemRow = function(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
    recalculatePurchaseTotals();
  }
};

window.recalculatePurchaseTotals = function() {
  const rows = document.querySelectorAll("#purchase-items-table-body tr");
  let subtotal = 0;
  let totalTax = 0;

  rows.forEach(row => {
    const qty = parseInt(row.querySelector(".pur-item-qty")?.value) || 0;
    const unitCost = parseFloat(row.querySelector(".pur-item-cost")?.value) || 0;
    const gstRate = parseFloat(row.querySelector(".pur-item-gst")?.value) || 0;
    const gstType = row.querySelector(".pur-item-gst-type")?.value || "exclusive";

    let taxable = 0;
    let tax = 0;
    let total = 0;

    if (gstType === "inclusive") {
      const lineGross = qty * unitCost;
      taxable = lineGross / (1 + (gstRate / 100));
      tax = lineGross - taxable;
      total = lineGross;
    } else {
      taxable = qty * unitCost;
      tax = taxable * (gstRate / 100);
      total = taxable + tax;
    }

    subtotal += taxable;
    totalTax += tax;

    const cellTaxable = row.querySelector(".pur-item-taxable");
    const cellTax = row.querySelector(".pur-item-tax");
    const cellTotal = row.querySelector(".pur-item-total");

    if (cellTaxable) cellTaxable.textContent = `₹${taxable.toFixed(2)}`;
    if (cellTax) cellTax.textContent = `₹${tax.toFixed(2)}`;
    if (cellTotal) cellTotal.textContent = `₹${total.toFixed(2)}`;
  });

  const otherExpenses = parseFloat(document.getElementById("purchase-other-expenses")?.value) || 0;
  const grandTotal = subtotal + totalTax + otherExpenses;

  const lblSubtotal = document.getElementById("purchase-lbl-subtotal");
  const lblTax = document.getElementById("purchase-lbl-tax");
  const lblTotal = document.getElementById("purchase-lbl-total");

  if (lblSubtotal) lblSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
  if (lblTax) lblTax.textContent = `₹${totalTax.toFixed(2)}`;
  if (lblTotal) lblTotal.textContent = `₹${grandTotal.toFixed(2)}`;
};

window.savePurchaseBill = async function() {
  const vendorName = document.getElementById("purchase-vendor-name").value.trim();
  const invoiceNo = document.getElementById("purchase-invoice-no").value.trim();
  const date = document.getElementById("purchase-date").value;
  const vendorGstin = document.getElementById("purchase-vendor-gstin").value.trim();
  const vendorPhone = document.getElementById("purchase-vendor-phone").value.trim();
  const paymentStatus = document.getElementById("purchase-payment-status").value;
  const paymentMethod = document.getElementById("purchase-payment-method").value;
  const notes = document.getElementById("purchase-notes").value.trim();

  if (!vendorName || !invoiceNo || !date) {
    alert("Please fill out Vendor Name, Invoice No, and Date.");
    return;
  }

  const rows = document.querySelectorAll("#purchase-items-table-body tr");
  const items = [];
  let subtotal = 0;
  let taxAmount = 0;

  for (const row of rows) {
    const select = row.querySelector(".pur-item-prod");
    const customInput = row.querySelector(".pur-item-custom-name");
    let productId = select?.value;
    const isCustom = (productId === "__CUSTOM_NEW__" || (customInput && customInput.style.display !== "none" && customInput.value.trim() !== ""));
    let productName = "";

    if (isCustom) {
      productName = customInput ? customInput.value.trim() : "";
      if (!productName) {
        alert("Please enter a name for the custom / new product line.");
        return;
      }
    } else if (productId) {
      productName = select?.options[select.selectedIndex]?.text.split(' (Stock:')[0].trim() || 'Item';
    }

    const hsnCode = row.querySelector(".pur-item-hsn")?.value.trim() || '0904';
    const qty = parseInt(row.querySelector(".pur-item-qty")?.value) || 0;
    const unitCost = parseFloat(row.querySelector(".pur-item-cost")?.value) || 0;
    const gstRate = parseFloat(row.querySelector(".pur-item-gst")?.value) || 0;
    const gstType = row.querySelector(".pur-item-gst-type")?.value || "exclusive";

    if (productName && qty > 0) {
      // Auto-create product if custom or doesn't exist yet
      if (isCustom || productId === "__CUSTOM_NEW__") {
        let existingProd = window.CoorgDB.getProducts().find(p => p.name.toLowerCase() === productName.toLowerCase());
        if (!existingProd) {
          const newId = 'prod-' + productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-4);
          const retailPrice = unitCost > 0 ? Math.round(unitCost * 1.4) : 100;
          const newProductObj = {
            id: newId,
            name: productName,
            price: retailPrice,
            costPrice: unitCost,
            oldPrice: null,
            rating: 5.0,
            ratingCount: 1,
            category: "Coorg Spices",
            image: "images/products/spices.jpg",
            images: ["images/products/spices.jpg"],
            description: `${productName} sourced fresh from verified Kodagu plantation farmers.`,
            ingredients: [productName],
            benefits: ["Fresh inward harvest from Coorg plantations", "100% natural, unadulterated quality"],
            usage: "Store in an airtight container in a cool, dry place.",
            origin: "Kodagu, Karnataka",
            stock: 0, // addPurchase will automatically add qty!
            hsnCode: hsnCode,
            gstRate: gstRate,
            gstType: gstType,
            badge: "Fresh Inward",
            reviews: []
          };
          await window.CoorgDB.addProduct(newProductObj);
          productId = newId;
        } else {
          productId = existingProd.id;
        }
      }

      let taxable = 0;
      let tax = 0;
      let total = 0;

      if (gstType === "inclusive") {
        const lineGross = qty * unitCost;
        taxable = lineGross / (1 + (gstRate / 100));
        tax = lineGross - taxable;
        total = lineGross;
      } else {
        taxable = qty * unitCost;
        tax = taxable * (gstRate / 100);
        total = taxable + tax;
      }

      subtotal += taxable;
      taxAmount += tax;

      items.push({
        productId,
        productName,
        hsnCode,
        qty,
        unitCost,
        gstRate,
        gstType,
        taxableAmount: taxable,
        taxAmount: tax,
        totalAmount: total
      });
    }
  }

  if (items.length === 0) {
    alert("Please select or type at least one product line for this inward bill.");
    return;
  }

  const otherExpenses = parseFloat(document.getElementById("purchase-other-expenses")?.value) || 0;

  const purchaseData = {
    id: `PUR-${Date.now().toString().slice(-6)}`,
    invoiceNo,
    vendorName,
    vendorGstin,
    vendorPhone,
    date,
    items,
    subtotal,
    taxAmount,
    otherExpenses,
    totalAmount: subtotal + taxAmount + otherExpenses,
    paymentStatus,
    paymentMethod,
    notes
  };

  try {
    await window.CoorgDB.addPurchase(purchaseData);
    alert(`🎉 Purchase Bill ${invoiceNo} recorded successfully! Inward stock and inventory catalog updated.`);
    closePurchaseModal();
    renderPurchasesTable();
    renderProductsTable();
    renderInventoryView();
    renderActivityLogsList();
  } catch (err) {
    console.error("Error saving purchase bill:", err);
    alert("Failed to save purchase bill. Please check console logs.");
  }
};

window.deletePurchaseBill = async function(id) {
  if (confirm(`Are you sure you want to delete purchase bill ${id}?`)) {
    await window.CoorgDB.deletePurchase(id);
    renderPurchasesTable();
    renderInventoryView();
  }
};

// ==========================================
// 11. INVENTORY & DAMAGED STOCK CONTROLLER
// ==========================================
function renderInventoryView(filterText = "") {
  const products = window.CoorgDB.getProducts();
  const damagedList = window.CoorgDB.getDamagedStock();
  const query = (filterText || document.getElementById("inventory-table-search")?.value || "").toLowerCase();

  // Metrics
  const totalUnits = products.reduce((s, p) => s + (parseInt(p.stock) || 0), 0);
  const totalCostVal = products.reduce((s, p) => s + ((parseInt(p.stock) || 0) * (parseFloat(p.costPrice) || 0)), 0);
  const lowStockCount = products.filter(p => (parseInt(p.stock) || 0) < 20).length;
  const totalDamageLoss = damagedList.reduce((s, d) => s + (parseFloat(d.totalLoss) || 0), 0);

  const statUnits = document.getElementById("stat-inventory-units");
  const statVal = document.getElementById("stat-inventory-cost-value");
  const statLow = document.getElementById("stat-inventory-low-stock");
  const statDamage = document.getElementById("stat-inventory-damage-loss");

  if (statUnits) statUnits.textContent = `${totalUnits} units`;
  if (statVal) statVal.textContent = `₹${totalCostVal.toFixed(2)}`;
  if (statLow) statLow.textContent = lowStockCount;
  if (statDamage) statDamage.textContent = `₹${totalDamageLoss.toFixed(2)}`;

  // Products Stock Table
  const tbody = document.getElementById("inventory-table-body");
  if (tbody) {
    const filteredProds = products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.category && p.category.toLowerCase().includes(query))
    );

    tbody.innerHTML = filteredProds.map(p => {
      const stock = parseInt(p.stock) || 0;
      const cp = parseFloat(p.costPrice) || Math.round(parseFloat(p.price || 0) * 0.5);
      const sp = parseFloat(p.price) || 0;
      const gst = p.gstRate !== undefined ? p.gstRate : 5.0;
      const valuation = stock * cp;
      
      let stockBadge = `<span style="background:#e8f5e9; color:#1b5e20; padding:2px 8px; border-radius:4px; font-size:0.8rem; font-weight:700;">${stock} units</span>`;
      if (stock === 0) {
        stockBadge = `<span style="background:#fde8e8; color:var(--red); padding:2px 8px; border-radius:4px; font-size:0.8rem; font-weight:700;">0 (Out of Stock)</span>`;
      } else if (stock < 20) {
        stockBadge = `<span style="background:#fff3e0; color:#e65100; padding:2px 8px; border-radius:4px; font-size:0.8rem; font-weight:700;">${stock} (Low Stock)</span>`;
      }

      return `
        <tr>
          <td data-label="Product">
            <div style="display:flex; align-items:center; gap:10px;">
              <img src="${p.image}" alt="${p.name}" style="width:38px; height:38px; object-fit:cover; border-radius:4px;">
              <div>
                <strong style="color:var(--primary-green); font-size:0.9rem;">${p.name}</strong>
                ${p.hsnCode ? `<div style="font-size:0.7rem; color:#64748b;">HSN: ${p.hsnCode}</div>` : ''}
              </div>
            </div>
          </td>
          <td data-label="Category" style="font-size:0.85rem; color:var(--medium-gray);">${p.category || 'General'}</td>
          <td data-label="Cost Price (CP)" style="font-weight:600; color:#b45309;">₹${cp.toFixed(2)}</td>
          <td data-label="GST Rate">
            <span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:3px; font-size:0.75rem; font-weight:600;">${gst}% GST</span>
            <div style="font-size:0.7rem; color:${(p.gstType || 'inclusive') === 'inclusive' ? '#15803d' : '#b45309'}; margin-top:2px; font-weight:600;">
              ${(p.gstType || 'inclusive') === 'inclusive' ? '● GST Included' : '○ GST Excluded'}
            </div>
          </td>
          <td data-label="Sale / Offer Price" style="font-weight:700; color:var(--primary-green);">
            ₹${sp.toFixed(2)}
            ${p.oldPrice ? `<del style="color:#94a3b8; font-size:0.75rem; margin-left:4px;">₹${p.oldPrice}</del>` : ''}
          </td>
          <td data-label="Stock Balance">${stockBadge}</td>
          <td data-label="Stock Valuation" style="font-weight:700; color:#1e293b;">₹${valuation.toFixed(2)}</td>
          <td data-label="Quick Actions">
            <div style="display:flex; gap:4px; align-items:center;">
              <button class="action-btn" onclick="quickAdjustStock('${p.id}', -1)" style="padding:3px 7px; font-size:0.75rem; background:#f0f0f0;" title="Deduct 1 unit">-1</button>
              <button class="action-btn" onclick="quickAdjustStock('${p.id}', 1)" style="padding:3px 7px; font-size:0.75rem; background:var(--primary-green); color:white;" title="Add 1 unit">+1</button>
              <button class="action-btn edit" onclick="openEditProductModal('${p.id}')" style="padding:3px 7px; font-size:0.75rem;" title="Edit Product Specs, Price & GST Rate"><i class="fa-regular fa-pen-to-square"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Damaged Stock Table
  const dmgTbody = document.getElementById("damaged-stock-table-body");
  if (dmgTbody) {
    if (damagedList.length === 0) {
      dmgTbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:25px; color:var(--medium-gray);">No damaged or spoiled stock recorded.</td></tr>`;
    } else {
      dmgTbody.innerHTML = damagedList.map(d => `
        <tr>
          <td data-label="Date" style="font-size:0.85rem;">${d.date}</td>
          <td data-label="Product"><strong>${d.productName}</strong></td>
          <td data-label="Quantity Lost" style="font-weight:700; color:var(--red);">${d.qty} units</td>
          <td data-label="Unit Cost">₹${(parseFloat(d.unitCost) || 0).toFixed(2)}</td>
          <td data-label="Total Loss Value" style="font-weight:700; color:var(--red);">₹${(parseFloat(d.totalLoss) || 0).toFixed(2)}</td>
          <td data-label="Reason">
            <span style="font-size:0.75rem; background:#fee2e2; color:#991b1b; padding:2px 6px; border-radius:3px;">
              ${d.reason}
            </span>
          </td>
          <td data-label="Notes" style="font-size:0.8rem; color:var(--medium-gray); max-width:200px;">${d.notes || '-'}</td>
          <td data-label="Action">
            <button class="action-btn delete" onclick="deleteDamagedStockEntry('${d.id}')" title="Delete Entry" style="padding:4px 7px;">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
  }
}

window.quickAdjustStock = async function(productId, delta) {
  const prod = window.CoorgDB.getProductById(productId);
  if (!prod) return;
  const newStock = Math.max(0, (parseInt(prod.stock) || 0) + delta);
  await window.CoorgDB.updateProductStock(productId, newStock);
  renderInventoryView();
  renderProductsTable();
};

window.openDamagedStockModal = function() {
  const products = window.CoorgDB.getProducts();
  const select = document.getElementById("damage-product-select");
  if (select) {
    select.innerHTML = products.map(p => 
      `<option value="${p.id}" data-cost="${p.costPrice || 0}">${p.name} (Stock: ${p.stock})</option>`
    ).join('');
  }

  document.getElementById("damage-date").value = new Date().toISOString().split('T')[0];
  document.getElementById("damage-qty").value = 1;
  document.getElementById("damage-notes").value = "";

  updateDamageProductCost();
  recalculateDamageTotal();

  document.getElementById("damaged-stock-modal-overlay").classList.add("active");
};

window.closeDamagedStockModal = function() {
  document.getElementById("damaged-stock-modal-overlay").classList.remove("active");
};

window.updateDamageProductCost = function() {
  const select = document.getElementById("damage-product-select");
  if (!select) return;
  const selectedOption = select.options[select.selectedIndex];
  const cost = selectedOption ? parseFloat(selectedOption.getAttribute("data-cost") || 0) : 0;
  document.getElementById("damage-unit-cost").value = cost.toFixed(2);
  recalculateDamageTotal();
};

window.recalculateDamageTotal = function() {
  const qty = parseInt(document.getElementById("damage-qty")?.value) || 0;
  const cost = parseFloat(document.getElementById("damage-unit-cost")?.value) || 0;
  const total = qty * cost;
  document.getElementById("damage-lbl-total-loss").textContent = `₹${total.toFixed(2)}`;
};

window.saveDamagedStockEntry = async function() {
  const select = document.getElementById("damage-product-select");
  const productId = select.value;
  const productName = select.options[select.selectedIndex].text.split(' (Stock:')[0];
  const qty = parseInt(document.getElementById("damage-qty").value) || 1;
  const unitCost = parseFloat(document.getElementById("damage-unit-cost").value) || 0;
  const reason = document.getElementById("damage-reason").value;
  const date = document.getElementById("damage-date").value;
  const notes = document.getElementById("damage-notes").value.trim();

  if (!productId || qty <= 0) {
    alert("Please select a product and valid quantity.");
    return;
  }

  const damageEntry = {
    id: `DMG-${Date.now().toString().slice(-6)}`,
    productId,
    productName,
    qty,
    unitCost,
    totalLoss: qty * unitCost,
    reason,
    date,
    notes
  };

  try {
    await window.CoorgDB.addDamagedStock(damageEntry);
    alert(`Damaged stock of ${qty} units recorded. Stock adjusted automatically.`);
    closeDamagedStockModal();
    renderInventoryView();
    renderProductsTable();
    renderActivityLogsList();
  } catch (err) {
    console.error("Error logging damaged stock:", err);
    alert("Failed to log damaged stock.");
  }
};

window.deleteDamagedStockEntry = async function(id) {
  if (confirm(`Remove this damaged stock record?`)) {
    await window.CoorgDB.deleteDamagedStock(id);
    renderInventoryView();
  }
};

// ==========================================
// 12. P&L & MULTI-CHANNEL ANALYTICS CONTROLLER
// ==========================================
function renderPnLView() {
  const orders = window.CoorgDB.getOrders();
  const damagedList = window.CoorgDB.getDamagedStock();

  const periodFilter = document.getElementById("pnl-period-filter")?.value || "ALL";
  const channelFilter = document.getElementById("pnl-channel-filter")?.value || "ALL";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Period filtering
  const filteredOrders = orders.filter(o => {
    const oDate = new Date(o.date);
    let matchesPeriod = true;
    if (periodFilter === "THIS_MONTH") {
      matchesPeriod = oDate.getFullYear() === currentYear && oDate.getMonth() === currentMonth;
    } else if (periodFilter === "LAST_MONTH") {
      matchesPeriod = oDate.getFullYear() === currentYear && oDate.getMonth() === (currentMonth - 1);
    } else if (periodFilter === "THIS_YEAR") {
      matchesPeriod = oDate.getFullYear() === currentYear;
    }

    const oChannel = o.channel || "Website";
    const matchesChannel = channelFilter === "ALL" || oChannel === channelFilter;

    return matchesPeriod && matchesChannel;
  });

  // Calculate Aggregates
  let grossRevenue = 0;
  let totalCogs = 0;
  let totalCommissions = 0;
  let totalShipping = 0;
  let totalPacking = 0;
  let totalReturnsLoss = 0;
  let totalNetProfit = 0;

  // Channel breakdown tracker
  const channels = ["Website", "Amazon", "Meesho", "Flipkart", "WhatsApp", "Instagram", "Store", "Phone"];
  const channelData = {};
  channels.forEach(ch => {
    channelData[ch] = {
      orders: 0,
      revenue: 0,
      cogs: 0,
      commission: 0,
      shipping: 0,
      packing: 0,
      returns: 0,
      netProfit: 0
    };
  });

  filteredOrders.forEach(o => {
    let ch = o.channel || "Website";
    if (ch === "Offline") ch = "Store";
    if (!channelData[ch]) ch = "Website";

    const total = parseFloat(o.total) || 0;
    const cogs = parseFloat(o.costPrice) || (total * 0.45);
    const comm = parseFloat(o.commission) || 0;
    const ship = parseFloat(o.deliveryCost) || (o.shipping || (ch === "Store" ? 0 : 50));
    const pack = parseFloat(o.packingCost) || (ch === "Store" ? 5 : 15);
    const retLoss = o.isReturned ? (parseFloat(o.returnLoss) || 0) : 0;
    const profit = o.isReturned ? -retLoss : (typeof o.netProfit === 'number' ? o.netProfit : (total - (cogs + comm + ship + pack)));

    grossRevenue += total;
    totalCogs += cogs;
    totalCommissions += comm;
    totalShipping += ship;
    totalPacking += pack;
    totalReturnsLoss += retLoss;
    totalNetProfit += profit;

    if (channelData[ch]) {
      channelData[ch].orders++;
      channelData[ch].revenue += total;
      channelData[ch].cogs += cogs;
      channelData[ch].commission += comm;
      channelData[ch].shipping += ship;
      channelData[ch].packing += pack;
      channelData[ch].returns += retLoss;
      channelData[ch].netProfit += profit;
    }
  });

  // Add overall damaged stock losses
  const damagedTotal = damagedList.reduce((s, d) => s + (parseFloat(d.totalLoss) || 0), 0);
  const overallLoss = totalReturnsLoss + damagedTotal;

  // Populate KPIs
  const statRev = document.getElementById("pnl-stat-revenue");
  const statCogs = document.getElementById("pnl-stat-cogs");
  const statComm = document.getElementById("pnl-stat-commissions");
  const statProfit = document.getElementById("pnl-stat-net-profit");
  const statMargin = document.getElementById("pnl-stat-margin-pct");
  const statShip = document.getElementById("pnl-stat-shipping");
  const statPack = document.getElementById("pnl-stat-packing");
  const statRet = document.getElementById("pnl-stat-returns");

  const overallMargin = grossRevenue > 0 ? ((totalNetProfit / grossRevenue) * 100).toFixed(1) : "0.0";

  if (statRev) statRev.textContent = `₹${grossRevenue.toFixed(2)}`;
  if (statCogs) statCogs.textContent = `₹${totalCogs.toFixed(2)}`;
  if (statComm) statComm.textContent = `₹${totalCommissions.toFixed(2)}`;
  if (statProfit) {
    statProfit.textContent = `₹${totalNetProfit.toFixed(2)}`;
    statProfit.style.color = totalNetProfit >= 0 ? "var(--primary-green)" : "var(--red)";
  }
  if (statMargin) statMargin.textContent = `${overallMargin}% net margin`;
  if (statShip) statShip.textContent = `₹${totalShipping.toFixed(2)}`;
  if (statPack) statPack.textContent = `₹${totalPacking.toFixed(2)}`;
  if (statRet) statRet.textContent = `₹${overallLoss.toFixed(2)}`;

  // Populate Channel Summary Table
  const chTbody = document.getElementById("pnl-channel-summary-body");
  if (chTbody) {
    chTbody.innerHTML = channels.map(ch => {
      const data = channelData[ch];
      const margin = data.revenue > 0 ? ((data.netProfit / data.revenue) * 100).toFixed(1) : "0.0";
      const profitColor = data.netProfit >= 0 ? "var(--primary-green)" : "var(--red)";

      return `
        <tr>
          <td data-label="Channel"><strong>${ch}</strong></td>
          <td data-label="Orders">${data.orders}</td>
          <td data-label="Gross Sales" style="font-weight:600;">₹${data.revenue.toFixed(2)}</td>
          <td data-label="COGS">₹${data.cogs.toFixed(2)}</td>
          <td data-label="Marketplace Fees">₹${data.commission.toFixed(2)}</td>
          <td data-label="Shipping">₹${data.shipping.toFixed(2)}</td>
          <td data-label="Packaging">₹${data.packing.toFixed(2)}</td>
          <td data-label="Returns" style="color:var(--red);">₹${data.returns.toFixed(2)}</td>
          <td data-label="Net Profit" style="font-weight:700; color:${profitColor};">₹${data.netProfit.toFixed(2)}</td>
          <td data-label="Margin" style="font-weight:600; color:${profitColor};">${margin}%</td>
        </tr>
      `;
    }).join('');
  }

  // Populate Order-level P&L Ledger
  const ordersTbody = document.getElementById("pnl-orders-table-body");
  if (ordersTbody) {
    if (filteredOrders.length === 0) {
      ordersTbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:25px; color:var(--medium-gray);">No orders found for the selected filters.</td></tr>`;
    } else {
      ordersTbody.innerHTML = filteredOrders.map(o => {
        const total = parseFloat(o.total) || 0;
        const cogs = parseFloat(o.costPrice) || (total * 0.45);
        const comm = parseFloat(o.commission) || 0;
        const ship = parseFloat(o.deliveryCost) || (o.shipping || 50);
        const profit = o.isReturned ? -(parseFloat(o.returnLoss) || 0) : (typeof o.netProfit === 'number' ? o.netProfit : (total - (cogs + comm + ship)));
        const profitColor = profit >= 0 ? "var(--primary-green)" : "var(--red)";

        return `
          <tr>
            <td data-label="Order ID" style="font-weight:600; color:var(--primary-green);">${o.id}</td>
            <td data-label="Channel">${o.channel || 'Website'}</td>
            <td data-label="Date" style="font-size:0.85rem;">${o.date}</td>
            <td data-label="Customer">${o.name}</td>
            <td data-label="Sale Value" style="font-weight:600;">₹${total.toFixed(2)}</td>
            <td data-label="Cost Price">₹${cogs.toFixed(2)}</td>
            <td data-label="Fees">₹${comm.toFixed(2)}</td>
            <td data-label="Shipping">₹${ship.toFixed(2)}</td>
            <td data-label="Net Profit" style="font-weight:700; color:${profitColor};">₹${profit.toFixed(2)}</td>
            <td data-label="Status">${o.isReturned ? '<span style="color:var(--red); font-weight:600;">Returned</span>' : (o.status || 'Paid')}</td>
            <td data-label="Breakdown">
              <button class="action-btn" onclick="openOrderPnLModal('${o.id}')" style="background:#2980b9; color:white; padding:4px 8px;" title="View Unit Economics">
                <i class="fa-solid fa-chart-pie"></i> View
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }
}

window.renderPnLView = renderPnLView;

window.exportPnLReportCSV = function() {
  const orders = window.CoorgDB.getOrders();
  let csv = "Order ID,Channel,Date,Customer,Total Amount,Cost Price (COGS),Marketplace Commission,Delivery Cost,Packing Cost,Net Profit,Net Margin %,Status,Is Returned,Return Loss\n";

  orders.forEach(o => {
    const total = parseFloat(o.total) || 0;
    const cogs = parseFloat(o.costPrice) || (total * 0.45);
    const comm = parseFloat(o.commission) || 0;
    const ship = parseFloat(o.deliveryCost) || (o.shipping || 50);
    const pack = parseFloat(o.packingCost) || 15;
    const profit = o.isReturned ? -(parseFloat(o.returnLoss) || 0) : (typeof o.netProfit === 'number' ? o.netProfit : (total - (cogs + comm + ship + pack)));
    const margin = total > 0 ? ((profit / total) * 100).toFixed(1) : "0.0";

    csv += `"${o.id}","${o.channel || 'Website'}","${o.date}","${(o.name || '').replace(/"/g, '""')}",${total.toFixed(2)},${cogs.toFixed(2)},${comm.toFixed(2)},${ship.toFixed(2)},${pack.toFixed(2)},${profit.toFixed(2)},${margin}%,"${o.status || 'Paid'}",${o.isReturned ? 'YES' : 'NO'},${(o.returnLoss || 0).toFixed(2)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Coorg_Harvest_PnL_Report_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
};

// ==========================================
// 13. MONTHLY GST REPORTS CONTROLLER (GSTR-1 & 3B)
// ==========================================
function renderGstReportsView() {
  const orders = window.CoorgDB.getOrders();
  const purchases = window.CoorgDB.getPurchases();

  // Populate Month filter options dynamically if empty
  const monthSelect = document.getElementById("gst-month-select");
  if (monthSelect && monthSelect.options.length === 0) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const now = new Date();
    
    // Add current and past 5 months
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthSelect.innerHTML += `<option value="${val}" ${i === 0 ? 'selected' : ''}>${label}</option>`;
    }
    monthSelect.innerHTML += `<option value="ALL">All Return Months</option>`;
  }

  const selectedMonth = monthSelect ? monthSelect.value : "ALL";

  // Filter Orders for Selected Month
  const filteredOrders = orders.filter(o => {
    if (selectedMonth === "ALL") return true;
    const oDate = new Date(o.date);
    const oMonth = `${oDate.getFullYear()}-${String(oDate.getMonth() + 1).padStart(2, '0')}`;
    return oMonth === selectedMonth;
  });

  // Filter Purchases for Selected Month
  const filteredPurchases = purchases.filter(p => {
    if (selectedMonth === "ALL") return true;
    const pDate = new Date(p.date);
    const pMonth = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
    return pMonth === selectedMonth;
  });

  // Calculate Outward Supplies GST
  let outwardTaxable = 0;
  let outwardCgst = 0;
  let outwardSgst = 0;
  let outwardIgst = 0;

  filteredOrders.forEach(o => {
    const total = parseFloat(o.total) || 0;
    const rate = parseFloat(o.gstRate) || 5.0;
    const taxable = o.taxableAmount ? parseFloat(o.taxableAmount) : parseFloat((total / (1 + (rate / 100))).toFixed(2));
    const tax = total - taxable;

    outwardTaxable += taxable;

    if (o.cgst || o.sgst || o.igst) {
      outwardCgst += parseFloat(o.cgst) || 0;
      outwardSgst += parseFloat(o.sgst) || 0;
      outwardIgst += parseFloat(o.igst) || 0;
    } else {
      if (o.customerGstin && !o.customerGstin.startsWith("29")) {
        outwardIgst += tax;
      } else {
        outwardCgst += tax / 2;
        outwardSgst += tax / 2;
      }
    }
  });

  const totalOutputGst = outwardCgst + outwardSgst + outwardIgst;

  // Calculate Inward Purchases ITC (Input Tax Credit)
  let itcTaxable = 0;
  let itcTotalTax = 0;

  filteredPurchases.forEach(p => {
    itcTaxable += parseFloat(p.subtotal) || 0;
    itcTotalTax += parseFloat(p.taxAmount) || 0;
  });

  const netPayableCash = Math.max(0, totalOutputGst - itcTotalTax);

  // Update KPI Cards
  const statTaxable = document.getElementById("gst-stat-taxable-sales");
  const statOutput = document.getElementById("gst-stat-output-tax");
  const statOutputBreak = document.getElementById("gst-stat-output-breakdown");
  const statItc = document.getElementById("gst-stat-itc-tax");
  const statPayable = document.getElementById("gst-stat-net-payable");

  if (statTaxable) statTaxable.textContent = `₹${outwardTaxable.toFixed(2)}`;
  if (statOutput) statOutput.textContent = `₹${totalOutputGst.toFixed(2)}`;
  if (statOutputBreak) statOutputBreak.textContent = `CGST: ₹${outwardCgst.toFixed(2)} | SGST: ₹${outwardSgst.toFixed(2)} | IGST: ₹${outwardIgst.toFixed(2)}`;
  if (statItc) statItc.textContent = `₹${itcTotalTax.toFixed(2)}`;
  if (statPayable) statPayable.textContent = `₹${netPayableCash.toFixed(2)}`;

  // Populate GSTR-3B Table
  const gstr3bBody = document.getElementById("gstr3b-table-body");
  if (gstr3bBody) {
    gstr3bBody.innerHTML = `
      <tr>
        <td><strong>3.1 Outward Taxable Supplies (Other than zero/nil rated)</strong></td>
        <td style="font-weight:600;">₹${outwardTaxable.toFixed(2)}</td>
        <td>₹${outwardCgst.toFixed(2)}</td>
        <td>₹${outwardSgst.toFixed(2)}</td>
        <td>₹${outwardIgst.toFixed(2)}</td>
        <td style="font-weight:700; color:var(--red);">₹${totalOutputGst.toFixed(2)}</td>
      </tr>
      <tr>
        <td><strong>4.0 Eligible Input Tax Credit (ITC from Inward Purchases)</strong></td>
        <td style="font-weight:600;">₹${itcTaxable.toFixed(2)}</td>
        <td>₹${(itcTotalTax / 2).toFixed(2)}</td>
        <td>₹${(itcTotalTax / 2).toFixed(2)}</td>
        <td>₹0.00</td>
        <td style="font-weight:700; color:var(--accent-gold);">₹${itcTotalTax.toFixed(2)}</td>
      </tr>
      <tr style="background:#e8f5e9; font-weight:700;">
        <td style="color:#1b5e20;"><strong>5.0 Net Tax Payable in Cash (Output Tax - Eligible ITC)</strong></td>
        <td>-</td>
        <td style="color:#1b5e20;">₹${Math.max(0, outwardCgst - (itcTotalTax / 2)).toFixed(2)}</td>
        <td style="color:#1b5e20;">₹${Math.max(0, outwardSgst - (itcTotalTax / 2)).toFixed(2)}</td>
        <td style="color:#1b5e20;">₹${outwardIgst.toFixed(2)}</td>
        <td style="color:#1b5e20; font-size:1.05rem;">₹${netPayableCash.toFixed(2)}</td>
      </tr>
    `;
  }

  // Populate GSTR-1 Table
  const gstr1Body = document.getElementById("gstr1-table-body");
  if (gstr1Body) {
    if (filteredOrders.length === 0) {
      gstr1Body.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:25px; color:var(--medium-gray);">No outward sales found for this month.</td></tr>`;
    } else {
      gstr1Body.innerHTML = filteredOrders.map(o => {
        const total = parseFloat(o.total) || 0;
        const rate = parseFloat(o.gstRate) || 5.0;
        const taxable = o.taxableAmount ? parseFloat(o.taxableAmount) : parseFloat((total / (1 + (rate / 100))).toFixed(2));
        const tax = total - taxable;
        const isB2B = Boolean(o.customerGstin);
        const supplyType = isB2B ? '<span style="color:#2980b9; font-weight:600;">B2B Invoice</span>' : '<span style="color:#27ae60;">B2C Retail</span>';

        let cgst = o.cgst ? parseFloat(o.cgst) : (isB2B && !o.customerGstin.startsWith("29") ? 0 : tax / 2);
        let sgst = o.sgst ? parseFloat(o.sgst) : (isB2B && !o.customerGstin.startsWith("29") ? 0 : tax / 2);
        let igst = o.igst ? parseFloat(o.igst) : (isB2B && !o.customerGstin.startsWith("29") ? tax : 0);

        return `
          <tr>
            <td data-label="Invoice">${o.id}</td>
            <td data-label="Customer">
              <strong>${o.name}</strong>
              ${o.customerGstin ? `<br><small style="color:#2980b9; font-weight:600;">GSTIN: ${o.customerGstin}</small>` : ''}
            </td>
            <td data-label="Supply Type">${supplyType}</td>
            <td data-label="Taxable" style="font-weight:600;">₹${taxable.toFixed(2)}</td>
            <td data-label="Rate">${rate}%</td>
            <td data-label="CGST">₹${cgst.toFixed(2)}</td>
            <td data-label="SGST">₹${sgst.toFixed(2)}</td>
            <td data-label="IGST">₹${igst.toFixed(2)}</td>
            <td data-label="Total" style="font-weight:700;">₹${total.toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    }
  }

  // Populate HSN Summary Table
  const hsnBody = document.getElementById("gst-hsn-table-body");
  if (hsnBody) {
    const hsnMap = {};

    filteredOrders.forEach(o => {
      (o.items || []).forEach(item => {
        const prod = window.CoorgDB.getProductById(item.id);
        const hsn = (prod && prod.hsnCode) ? prod.hsnCode : "0904";
        const desc = (prod && prod.category) ? prod.category : "Spices & Farm Produce";
        const qty = item.qty || 1;
        const total = (item.price || 0) * qty;
        const taxable = total / 1.05;
        const tax = total - taxable;

        if (!hsnMap[hsn]) {
          hsnMap[hsn] = {
            hsn,
            desc,
            qty: 0,
            totalVal: 0,
            taxable: 0,
            cgst: 0,
            sgst: 0,
            igst: 0
          };
        }

        hsnMap[hsn].qty += qty;
        hsnMap[hsn].totalVal += total;
        hsnMap[hsn].taxable += taxable;
        hsnMap[hsn].cgst += tax / 2;
        hsnMap[hsn].sgst += tax / 2;
      });
    });

    const hsnKeys = Object.keys(hsnMap);
    if (hsnKeys.length === 0) {
      hsnBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--medium-gray);">No items to display.</td></tr>`;
    } else {
      hsnBody.innerHTML = hsnKeys.map(k => {
        const h = hsnMap[k];
        return `
          <tr>
            <td data-label="HSN"><strong>${h.hsn}</strong></td>
            <td data-label="Description">${h.desc}</td>
            <td data-label="Total Qty">${h.qty}</td>
            <td data-label="Total Value">₹${h.totalVal.toFixed(2)}</td>
            <td data-label="Taxable" style="font-weight:600;">₹${h.taxable.toFixed(2)}</td>
            <td data-label="CGST">₹${h.cgst.toFixed(2)}</td>
            <td data-label="SGST">₹${h.sgst.toFixed(2)}</td>
            <td data-label="IGST">₹${h.igst.toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    }
  }
}

window.renderGstReportsView = renderGstReportsView;

window.exportGstr1CSV = function() {
  const orders = window.CoorgDB.getOrders();
  let csv = "Invoice Number,Invoice Date,Customer Name,Customer GSTIN,Supply Type,Taxable Value,GST Rate,CGST,SGST,IGST,Invoice Total\n";

  orders.forEach(o => {
    const total = parseFloat(o.total) || 0;
    const rate = parseFloat(o.gstRate) || 5.0;
    const taxable = o.taxableAmount ? parseFloat(o.taxableAmount) : parseFloat((total / (1 + (rate / 100))).toFixed(2));
    const tax = total - taxable;
    const isB2B = Boolean(o.customerGstin);
    const supplyType = isB2B ? "B2B" : "B2C";

    let cgst = o.cgst ? parseFloat(o.cgst) : (isB2B && !o.customerGstin.startsWith("29") ? 0 : tax / 2);
    let sgst = o.sgst ? parseFloat(o.sgst) : (isB2B && !o.customerGstin.startsWith("29") ? 0 : tax / 2);
    let igst = o.igst ? parseFloat(o.igst) : (isB2B && !o.customerGstin.startsWith("29") ? tax : 0);

    csv += `"${o.id}","${o.date}","${(o.name || '').replace(/"/g, '""')}","${o.customerGstin || ''}","${supplyType}",${taxable.toFixed(2)},${rate}%,${cgst.toFixed(2)},${sgst.toFixed(2)},${igst.toFixed(2)},${total.toFixed(2)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Coorg_Harvest_GSTR1_Report_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
};

window.exportGstr3BCSV = function() {
  const orders = window.CoorgDB.getOrders();
  const purchases = window.CoorgDB.getPurchases();

  let outwardTaxable = 0, outwardTax = 0;
  orders.forEach(o => {
    const t = parseFloat(o.total) || 0;
    const taxable = o.taxableAmount ? parseFloat(o.taxableAmount) : (t / 1.05);
    outwardTaxable += taxable;
    outwardTax += (t - taxable);
  });

  let inwardTaxable = 0, inwardTax = 0;
  purchases.forEach(p => {
    inwardTaxable += parseFloat(p.subtotal) || 0;
    inwardTax += parseFloat(p.taxAmount) || 0;
  });

  const netCash = Math.max(0, outwardTax - inwardTax);

  let csv = "Section,Table Description,Taxable Value,CGST,SGST,IGST,Total Tax\n";
  csv += `"3.1","Outward Taxable Supplies",${outwardTaxable.toFixed(2)},${(outwardTax / 2).toFixed(2)},${(outwardTax / 2).toFixed(2)},0.00,${outwardTax.toFixed(2)}\n`;
  csv += `"4.0","Eligible ITC from Inward Purchases",${inwardTaxable.toFixed(2)},${(inwardTax / 2).toFixed(2)},${(inwardTax / 2).toFixed(2)},0.00,${inwardTax.toFixed(2)}\n`;
  csv += `"5.0","Net Tax Payable in Cash",0.00,${(netCash / 2).toFixed(2)},${(netCash / 2).toFixed(2)},0.00,${netCash.toFixed(2)}\n`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Coorg_Harvest_GSTR3B_Summary_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
};

// ==========================================
// 14. ORDER P&L BREAKDOWN MODAL
// ==========================================
window.openOrderPnLModal = function(orderId) {
  const o = window.CoorgDB.getOrderById(orderId);
  if (!o) return;

  const total = parseFloat(o.total) || 0;
  const cogs = parseFloat(o.costPrice) || (total * 0.45);
  const shipCost = parseFloat(o.deliveryCost) || (o.shipping || 50);
  const comm = parseFloat(o.commission) || 0;
  const pack = parseFloat(o.packingCost) || 15;
  const netProfit = o.isReturned ? -(parseFloat(o.returnLoss) || 0) : (typeof o.netProfit === 'number' ? o.netProfit : (total - (cogs + comm + shipCost + pack)));
  const marginPct = total > 0 ? ((netProfit / total) * 100).toFixed(1) : "0.0";

  const profitColor = netProfit >= 0 ? "var(--primary-green)" : "var(--red)";

  const content = document.getElementById("order-pnl-modal-content");
  if (content) {
    content.innerHTML = `
      <div style="background:#f7f6f2; padding:15px; border-radius:6px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700; font-size:1.1rem; color:var(--primary-green);">${o.id}</div>
          <div style="font-size:0.85rem; color:var(--medium-gray); margin-top:2px;">Channel: <strong>${o.channel || 'Website'}</strong> | ${o.date}</div>
          <div style="font-size:0.85rem; margin-top:2px;">Customer: <strong>${o.name}</strong> (${o.phone})</div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:0.8rem; font-weight:600; text-transform:uppercase; color:var(--medium-gray);">Order Status</span>
          <div style="font-size:1rem; font-weight:700; color:${o.isReturned ? 'var(--red)' : 'var(--primary-green)'};">
            ${o.isReturned ? 'Returned / RTO' : (o.status || 'Paid')}
          </div>
        </div>
      </div>

      <div style="border:1px solid var(--light-gray); border-radius:6px; overflow:hidden; margin-bottom:20px;">
        <table class="admin-table" style="font-size:0.9rem;">
          <tbody>
            <tr>
              <td><strong>Customer Invoiced Value (Gross)</strong></td>
              <td style="text-align:right; font-weight:700; font-size:1rem;">₹${total.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color:#d35400;"><i class="fa-solid fa-minus"></i> Cost of Goods Sold (COGS)</td>
              <td style="text-align:right; color:#d35400;">-₹${cogs.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color:#2980b9;"><i class="fa-solid fa-minus"></i> Courier / Delivery Expense</td>
              <td style="text-align:right; color:#2980b9;">-₹${shipCost.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color:#8e44ad;"><i class="fa-solid fa-minus"></i> Marketplace Commission / Gateway Fee</td>
              <td style="text-align:right; color:#8e44ad;">-₹${comm.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color:#16a085;"><i class="fa-solid fa-minus"></i> Packaging Material Cost</td>
              <td style="text-align:right; color:#16a085;">-₹${pack.toFixed(2)}</td>
            </tr>
            ${o.isReturned ? `
            <tr style="background:#fee2e2;">
              <td style="color:var(--red); font-weight:700;"><i class="fa-solid fa-arrow-rotate-left"></i> Return / RTO Damage Loss</td>
              <td style="text-align:right; color:var(--red); font-weight:700;">-₹${(parseFloat(o.returnLoss) || 0).toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr style="background:#f4f9f5; font-size:1.1rem; border-top:2px solid var(--primary-green);">
              <td style="color:${profitColor}; font-weight:700;"><strong>Net Profit Realized</strong></td>
              <td style="text-align:right; font-weight:700; color:${profitColor};">₹${netProfit.toFixed(2)} (${marginPct}%)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="font-size:0.8rem; color:var(--medium-gray); line-height:1.4;">
        <i class="fa-solid fa-circle-info"></i> Taxes included: ₹${((parseFloat(o.cgst) || 0) + (parseFloat(o.sgst) || 0) + (parseFloat(o.igst) || 0)).toFixed(2)} GST.
      </div>
    `;
  }

  document.getElementById("order-pnl-modal-overlay").classList.add("active");
};

window.closeOrderPnLModal = function() {
  document.getElementById("order-pnl-modal-overlay").classList.remove("active");
};

// ==========================================
// 15. CUSTOMER RETURN / RTO CONTROLLER
// ==========================================
window.openOrderReturnModal = function(orderId) {
  const o = window.CoorgDB.getOrderById(orderId);
  if (!o) return;

  document.getElementById("return-order-id").value = orderId;
  document.getElementById("return-lbl-order-info").textContent = `Order #${o.id} - ${o.name}`;
  document.getElementById("return-lbl-order-total").textContent = `Original Sale: ₹${(parseFloat(o.total) || 0).toFixed(2)} | Channel: ${o.channel || 'Website'}`;
  document.getElementById("return-cost").value = "60";
  document.getElementById("return-notes").value = "";

  const itemsContainer = document.getElementById("return-items-selection-list");
  if (itemsContainer) {
    itemsContainer.innerHTML = (o.items || []).map((item, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;">
        <div>
          <strong style="font-size:0.85rem;">${item.name}</strong>
          <div style="font-size:0.75rem; color:var(--medium-gray);">Qty: ${item.qty} | Price: ₹${item.price}</div>
        </div>
        <div style="display:flex; gap:12px; align-items:center;">
          <label style="font-size:0.8rem; display:flex; align-items:center; gap:4px; cursor:pointer; color:#1b5e20;">
            <input type="radio" name="item_action_${idx}" value="RESTOCK" checked onchange="window.recalculateReturnLoss()">
            Restock (Good Condition)
          </label>
          <label style="font-size:0.8rem; display:flex; align-items:center; gap:4px; cursor:pointer; color:var(--red);">
            <input type="radio" name="item_action_${idx}" value="DAMAGED" onchange="window.recalculateReturnLoss()">
            Damaged (Loss)
          </label>
        </div>
      </div>
    `).join('');
  }

  recalculateReturnLoss();
  document.getElementById("order-return-modal-overlay").classList.add("active");
};

window.closeOrderReturnModal = function() {
  document.getElementById("order-return-modal-overlay").classList.remove("active");
};

window.recalculateReturnLoss = function() {
  const orderId = document.getElementById("return-order-id").value;
  const o = window.CoorgDB.getOrderById(orderId);
  if (!o) return;

  const returnShipping = parseFloat(document.getElementById("return-cost").value) || 0;
  let itemsDamageLoss = 0;

  (o.items || []).forEach((item, idx) => {
    const radio = document.querySelector(`input[name="item_action_${idx}"]:checked`);
    if (radio && radio.value === "DAMAGED") {
      const prod = window.CoorgDB.getProductById(item.id);
      const cp = prod && prod.costPrice ? parseFloat(prod.costPrice) : ((item.price || 0) * 0.5);
      itemsDamageLoss += (cp * (item.qty || 1));
    }
  });

  const totalLoss = returnShipping + itemsDamageLoss;
  const lbl = document.getElementById("return-lbl-total-loss");
  if (lbl) lbl.textContent = `₹${totalLoss.toFixed(2)}`;
};

window.confirmOrderReturn = async function() {
  const orderId = document.getElementById("return-order-id").value;
  const o = window.CoorgDB.getOrderById(orderId);
  if (!o) return;

  const returnReason = document.getElementById("return-reason").value;
  const returnCost = parseFloat(document.getElementById("return-cost").value) || 0;
  const notes = document.getElementById("return-notes").value.trim();

  const restockItems = [];
  const damagedItems = [];

  (o.items || []).forEach((item, idx) => {
    const radio = document.querySelector(`input[name="item_action_${idx}"]:checked`);
    const prod = window.CoorgDB.getProductById(item.id);
    const cp = prod && prod.costPrice ? parseFloat(prod.costPrice) : ((item.price || 0) * 0.5);

    if (radio && radio.value === "RESTOCK") {
      restockItems.push({ id: item.id, qty: item.qty });
    } else {
      damagedItems.push({ id: item.id, name: item.name, qty: item.qty, costPrice: cp });
    }
  });

  const damagedCostTotal = damagedItems.reduce((s, d) => s + (d.costPrice * d.qty), 0);
  const totalReturnLoss = returnCost + damagedCostTotal;

  const returnData = {
    returnCost: returnCost,
    returnLoss: totalReturnLoss,
    returnReason: returnReason,
    notes: notes,
    date: new Date().toLocaleDateString(),
    restockItems: restockItems,
    damagedItems: damagedItems
  };

  try {
    await window.CoorgDB.processOrderReturn(orderId, returnData);
    alert(`🎉 Order ${orderId} marked as Returned. Stock levels and return loss updated successfully!`);
    closeOrderReturnModal();
    renderOrdersTable();
    renderInventoryView();
    renderActivityLogsList();
  } catch (err) {
    console.error("Error processing return:", err);
    alert("Failed to process order return.");
  }
};
