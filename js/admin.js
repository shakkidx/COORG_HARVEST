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

// Switch between dashboard, products, orders and coupons views
function setupTabSwitches() {
  const menuItems = document.querySelectorAll(".admin-menu-item");
  const tabs = document.querySelectorAll(".admin-view-tab");
  const viewTitle = document.getElementById("admin-view-title");
  const headerBtn = document.getElementById("admin-header-btn");

  menuItems.forEach(item => {
    item.addEventListener("click", function(e) {
      // Ignore final store redirect
      if (this.getAttribute("href") !== "#") return;
      e.preventDefault();

      const targetView = this.getAttribute("data-view");

      // Active menu highlighting
      menuItems.forEach(m => m.classList.remove("active"));
      this.classList.add("active");

      // Tab toggling
      tabs.forEach(t => t.style.display = "none");
      document.getElementById(targetView).style.display = "block";

      // View title and header buttons setup
      if (targetView === "dashboard-view") {
        viewTitle.textContent = "Dashboard Overview";
        headerBtn.style.display = "inline-flex";
        headerBtn.innerHTML = `Add New Product <i class="fa-solid fa-plus"></i>`;
        headerBtn.setAttribute("onclick", "openAddProductModal()");
        loadAnalytics(); // refresh metrics
      } else if (targetView === "products-view") {
        viewTitle.textContent = "Products Catalog CRUD";
        headerBtn.style.display = "inline-flex";
        headerBtn.innerHTML = `Create Product <i class="fa-solid fa-plus"></i>`;
        headerBtn.setAttribute("onclick", "openAddProductModal()");
        renderProductsTable();
      } else if (targetView === "orders-view") {
        viewTitle.textContent = "Orders Ledger Log";
        headerBtn.style.display = "none";
        renderOrdersTable();
      } else if (targetView === "coupons-view") {
        viewTitle.textContent = "Discount Coupons Control";
        headerBtn.style.display = "none";
        renderCouponsTable();
      } else if (targetView === "categories-view") {
        viewTitle.textContent = "Product Categories CRUD";
        headerBtn.style.display = "none";
        renderCategoriesTable();
      }
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
      <td><img src="${p.image}" alt="${p.name}"></td>
      <td style="font-weight:600; color:var(--primary-green);">${p.name}</td>
      <td>${p.category}</td>
      <td style="font-weight:600;">₹${p.price}</td>
      <td>
        <span style="font-weight:600; color:${p.stock < 20 ? 'var(--red)' : 'var(--dark-text)'};">
          ${p.stock} units
        </span>
        ${p.stock < 20 ? '<br><small style="color:var(--red); font-weight:500;">(Low stock warning)</small>' : ''}
      </td>
      <td><i class="fa-solid fa-star" style="color:#F39C12;"></i> ${p.rating.toFixed(1)} (${p.ratingCount})</td>
      <td>
        <div class="action-btns">
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
  
  // Set default placeholder nature image
  document.getElementById("crud-image").value = "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80";

  resetUploadStatus();
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
  document.getElementById("crud-stock").value = p.stock;
  document.getElementById("crud-image").value = p.image;
  document.getElementById("crud-desc").value = p.description;
  document.getElementById("crud-origin").value = p.origin;
  document.getElementById("crud-ingredients").value = p.ingredients.join(", ");
  document.getElementById("crud-benefits").value = p.benefits.join(", ");
  document.getElementById("crud-usage").value = p.usage;

  resetUploadStatus();
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
  const stock = parseInt(document.getElementById("crud-stock").value);
  const image = document.getElementById("crud-image").value;
  const description = document.getElementById("crud-desc").value.trim();
  const origin = document.getElementById("crud-origin").value.trim();
  const ingredients = document.getElementById("crud-ingredients").value.split(",").map(i => i.trim());
  const benefits = document.getElementById("crud-benefits").value.split(",").map(b => b.trim());
  const usage = document.getElementById("crud-usage").value.trim();

  if (id) {
    // Modify Edit mode
    const oldProduct = window.CoorgDB.getProductById(id);
    const updated = {
      ...oldProduct,
      name, category, price, stock, image, description, origin, ingredients, benefits, usage
    };
    await window.CoorgDB.updateProduct(updated);
  } else {
    // New Product Mode
    const newId = category.toLowerCase().replace(/ /g, "-") + "-" + name.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
    const newProduct = {
      id: newId,
      name, category, price, stock, image, description, origin, ingredients, benefits, usage,
      rating: 5.0,
      ratingCount: 0,
      badge: "New Sourcing",
      reviews: []
    };
    await window.CoorgDB.addProduct(newProduct);
  }

  closeProductModal();
  renderProductsTable();
  loadAnalytics(); // update metrics count
};

window.deleteProductHandler = async function(id) {
  if (confirm("Are you sure you want to permanently delete this product from the catalog?")) {
    await window.CoorgDB.deleteProduct(id);
    renderProductsTable();
    loadAnalytics();
  }
};


// ORDERS log table render
function renderOrdersTable(filterText = "") {
  const tbody = document.getElementById("order-table-body");
  if (!tbody) return;

  const orders = window.CoorgDB.getOrders();
  const query = filterText.toLowerCase();

  const filtered = orders.filter(o => 
    o.id.toLowerCase().includes(query) || 
    o.name.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--medium-gray);">No orders found.</td></tr>`;
    return;
  }

  // Sort orders latest first
  const sorted = [...filtered].sort((a,b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = sorted.map(o => `
    <tr>
      <td style="font-weight:600; color:var(--primary-green);">${o.id}</td>
      <td>
        <strong>${o.name}</strong><br>
        <small style="color:var(--medium-gray);">${o.phone}</small>
      </td>
      <td>${o.date}</td>
      <td style="font-weight:600;">₹${o.total.toFixed(2)}</td>
      <td><span style="font-size:0.8rem; font-weight:600; color:var(--earth-brown);">${o.paymentMethod}</span></td>
      <td>
        <select class="form-control" style="padding:6px; font-size:0.8rem; border-radius:4px; border-color:var(--light-gray);" onchange="changeOrderStatusHandler('${o.id}', this.value)">
          <option value="Paid" ${o.status === 'Paid' ? 'selected' : ''}>Paid / Verified</option>
          <option value="Pending COD" ${o.status === 'Pending COD' ? 'selected' : ''}>Pending COD</option>
          <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
        </select>
      </td>
      <td>
        <div class="action-btns">
          <button class="action-btn download" onclick="adminDownloadInvoice('${o.id}')" title="Print Invoice PDF"><i class="fa-solid fa-file-arrow-down"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.changeOrderStatusHandler = async function(orderId, newStatus) {
  await window.CoorgDB.updateOrderStatus(orderId, newStatus);
  renderOrdersTable();
  renderActivityLogsList();
};

// Admin Reprinting PDF Action (binds to success page invoice methods)
window.adminDownloadInvoice = function(id) {
  const order = window.CoorgDB.getOrderById(id);
  if (!order) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const themeColor = "#2E5E3E";
  const goldColor = "#C5A059";

  // HEADER BANNER
  doc.setFillColor(12, 32, 18);
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("COORG HARVEST", 15, 18);
  
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(197, 160, 89);
  doc.text("Premium Spices, Teas & Wellness from Kodagu", 15, 24);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Email: info@coorgharvest.com", 145, 15);
  doc.text("Phone: +91 9880077218", 145, 20);
  doc.text("Bypass Road, Gonikopal, Kodagu", 145, 25);
  doc.text("PIN Code: 571213, Karnataka, India", 145, 30);

  // META
  doc.setTextColor(29, 29, 29);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("DUPLICATE INVOICE", 15, 55);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Invoice Number: ${order.id}`, 15, 63);
  doc.text(`Invoice Date: ${order.date}`, 15, 69);
  doc.text(`Payment Status: ${order.status}`, 15, 75);

  // BILLING ADDRESS
  doc.setFont("helvetica", "bold");
  doc.text("Billed & Shipped To:", 125, 55);
  doc.setFont("helvetica", "normal");
  
  const splitAddress = doc.splitTextToSize(order.address, 75);
  doc.text(order.name, 125, 63);
  doc.text(`Phone: ${order.phone}`, 125, 69);
  doc.text(`Email: ${order.email}`, 125, 75);
  doc.text(splitAddress, 125, 81);

  // TABLE HEADERS
  doc.setDrawColor(232, 226, 213);
  doc.setFillColor(247, 243, 232);
  doc.rect(15, 105, 180, 8, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(46, 94, 62);
  doc.text("Item Sourced Product Name", 18, 110.5);
  doc.text("Price (INR)", 115, 110.5);
  doc.text("Qty", 150, 110.5);
  doc.text("Total (INR)", 172, 110.5);
  
  doc.line(15, 113, 195, 113);

  // TABLE BODY ITEMS
  doc.setFont("helvetica", "normal");
  doc.setTextColor(29, 29, 29);
  let currentY = 120;

  order.items.forEach(item => {
    doc.text(item.name, 18, currentY);
    doc.text(`Rs. ${item.price.toFixed(2)}`, 115, currentY);
    doc.text(item.qty.toString(), 151, currentY);
    
    const lineTotal = item.price * item.qty;
    doc.text(`Rs. ${lineTotal.toFixed(2)}`, 172, currentY);
    
    currentY += 8;
  });

  doc.line(15, currentY + 2, 195, currentY + 2);
  currentY += 12;

  // MATHS
  const gstRate = 0.05;
  const gstAmt = (order.subtotal / (1 + gstRate)) * gstRate;
  const cgstAmt = gstAmt / 2;
  const sgstAmt = gstAmt / 2;

  doc.text("Subtotal:", 125, currentY);
  doc.text(`Rs. ${order.subtotal.toFixed(2)}`, 172, currentY);
  currentY += 6;

  doc.text("CGST (2.5%):", 125, currentY);
  doc.text(`Rs. ${cgstAmt.toFixed(2)}`, 172, currentY);
  currentY += 6;

  doc.text("SGST (2.5%):", 125, currentY);
  doc.text(`Rs. ${sgstAmt.toFixed(2)}`, 172, currentY);
  currentY += 6;

  if (order.discount > 0) {
    doc.setTextColor(39, 174, 96);
    doc.text("Coupon Discount:", 125, currentY);
    doc.text(`-Rs. ${order.discount.toFixed(2)}`, 172, currentY);
    doc.setTextColor(29, 29, 29);
    currentY += 6;
  }

  doc.text("Delivery Charges:", 125, currentY);
  doc.text(order.shipping === 0 ? "FREE" : `Rs. ${order.shipping.toFixed(2)}`, 172, currentY);
  currentY += 8;

  doc.line(125, currentY - 2, 195, currentY - 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(46, 94, 62);
  doc.text("Grand Total:", 125, currentY + 3);
  doc.text(`Rs. ${order.total.toFixed(2)}`, 172, currentY + 3);

  // VERIFIED STAMP
  doc.setDrawColor(46, 94, 62);
  doc.rect(15, currentY - 20, 30, 30);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(138, 129, 112);
  doc.text("VERIFIED TRANSACTION", 16, currentY + 13);
  doc.text("GSTIN: 29AAXFC8802R1ZH", 16, currentY + 16);
  
  doc.setFillColor(46, 94, 62);
  doc.rect(18, currentY - 17, 7, 7);
  doc.rect(35, currentY - 17, 7, 7);
  doc.rect(18, currentY - 10, 7, 7);

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for supporting Kodagu's small farmers!", 105, 275, null, null, "center");

  // SAVE
  doc.save(`Invoice_${order.id}_Dupe.pdf`);
};


// COUPON codes control list render
function renderCouponsTable() {
  const tbody = document.getElementById("coupon-table-body");
  if (!tbody) return;

  const coupons = window.CoorgDB.getCoupons();

  if (coupons.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--medium-gray);">No coupons created.</td></tr>`;
    return;
  }

  tbody.innerHTML = coupons.map(c => `
    <tr>
      <td style="font-weight:700; color:var(--accent-gold);">${c.code}</td>
      <td style="text-transform:capitalize;">${c.type}</td>
      <td style="font-weight:600;">${c.type === 'percent' ? c.value + '%' : '₹' + c.value}</td>
      <td>${c.description}</td>
      <td>
        <button class="action-btn delete" onclick="deleteCouponHandler('${c.code}')" title="Delete Coupon"><i class="fa-regular fa-trash-can"></i></button>
      </td>
    </tr>
  `).join('');
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
