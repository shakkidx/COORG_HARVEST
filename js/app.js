// GLOBAL INTERACTIONS - COORG HARVEST
document.addEventListener("DOMContentLoaded", function() {
  // Inject FontAwesome CDN if not present
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const fa = document.createElement('link');
    fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(fa);
  }

  // 1. DYNAMIC HEADER AND FOOTER INJECTION
  injectHeaderAndCart();
  injectFooter();
  injectWhatsAppWidget();

  // 2. STICKY HEADER ON SCROLL
  const header = document.getElementById("site-header");
  if (header) {
    window.addEventListener("scroll", function() {
      if (window.scrollY > 50) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    });
  }

  // 3. SEARCH OVERLAY CONTROL
  setupSearchOverlay();

  // 4. FLOATING CART DRAWER INTERACTION
  setupCartDrawer();

  // 5. UPDATE CART BADGE ON LOAD
  updateCartBadge();
  
  // Listen for db updates
  window.addEventListener("cartUpdated", function() {
    updateCartBadge();
    renderCartItems();
  });
});

// Update standard cart badge count
function updateCartBadge() {
  const cart = window.CoorgDB.getCart();
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const badges = document.querySelectorAll(".cart-count-badge");
  badges.forEach(badge => {
    badge.textContent = totalCount;
    badge.style.display = totalCount > 0 ? "flex" : "none";
  });
}

// Injects the premium header HTML dynamically
function injectHeaderAndCart() {
  const headerContainer = document.getElementById("site-header");
  if (!headerContainer) return;

  const currentPath = window.location.pathname;
  const isHome = currentPath.endsWith("index.html") || currentPath.endsWith("/") || currentPath === "";
  
  headerContainer.innerHTML = `
    <div class="container">
      <nav class="nav-container">
        <a href="index.html" class="logo" style="display: flex; align-items: center;">
          <img src="logo.png" alt="Coorg Harvest" style="height: 55px; width: auto; object-fit: contain;">
          <h1 style="display: none;">Coorg Harvest</h1>
        </a>
        <ul class="nav-menu" id="nav-menu">
          <li><a href="index.html" class="nav-link ${isHome ? 'active' : ''}">Home</a></li>
          <li><a href="shop.html" class="nav-link ${currentPath.includes('shop.html') ? 'active' : ''}">Shop Spices</a></li>
          <li><a href="recipes.html" class="nav-link ${currentPath.includes('recipes.html') ? 'active' : ''}">Recipes & Guides</a></li>
          <li><a href="about.html" class="nav-link ${currentPath.includes('about.html') ? 'active' : ''}">Our Story</a></li>
          <li><a href="faq.html" class="nav-link ${currentPath.includes('faq.html') ? 'active' : ''}">FAQ</a></li>
        </ul>
        <div class="nav-icons">
          <a href="#" class="nav-icon" id="search-trigger" title="Search Products">
            <i class="fa-solid fa-magnifying-glass"></i>
          </a>
          <a href="#" class="nav-icon" id="cart-trigger" title="Shopping Cart">
            <i class="fa-solid fa-bag-shopping"></i>
            <span class="badge cart-count-badge">0</span>
          </a>
          <button class="menu-toggle" id="menu-toggle">
            <i class="fa-solid fa-bars"></i>
          </button>
        </div>
      </nav>
    </div>
  `;

  // Inject Search Overlay HTML
  const searchOverlay = document.createElement("div");
  searchOverlay.className = "search-overlay";
  searchOverlay.id = "search-overlay";
  searchOverlay.innerHTML = `
    <button class="search-close" id="search-close"><i class="fa-solid fa-xmark"></i></button>
    <div class="search-box-container">
      <div class="search-input-wrapper">
        <input type="text" id="search-input" placeholder="What are you searching for...?" autofocus>
      </div>
      <div class="search-results-preview" id="search-results-preview">
        <!-- populated dynamically -->
      </div>
    </div>
  `;
  document.body.appendChild(searchOverlay);

  // Inject Sliding Cart Drawer HTML
  const cartDrawerOverlay = document.createElement("div");
  cartDrawerOverlay.className = "cart-drawer-overlay";
  cartDrawerOverlay.id = "cart-drawer-overlay";
  document.body.appendChild(cartDrawerOverlay);

  const cartDrawer = document.createElement("div");
  cartDrawer.className = "cart-drawer";
  cartDrawer.id = "cart-drawer";
  cartDrawer.innerHTML = `
    <div class="cart-drawer-header">
      <h2>Shopping Cart</h2>
      <button class="cart-drawer-close" id="cart-drawer-close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="cart-drawer-items" id="cart-drawer-items">
      <!-- Cart items list -->
    </div>
    <div class="cart-drawer-footer">
      <div class="cart-coupon-area">
        <input type="text" id="coupon-code-input" placeholder="Enter coupon code (COORG20)">
        <button id="apply-coupon-btn">Apply</button>
      </div>
      <div id="coupon-msg-feedback" class="coupon-status"></div>
      
      <div class="cart-summary-row">
        <span>Subtotal</span>
        <span id="cart-subtotal">₹0.00</span>
      </div>
      <div class="cart-summary-row" id="coupon-discount-row" style="display: none;">
        <span>Discount (<span id="discount-label">0%</span>)</span>
        <span id="cart-discount" style="color: #27AE60;">-₹0.00</span>
      </div>
      <div class="cart-summary-row">
        <span>Delivery Fee</span>
        <span id="cart-shipping">₹50.00</span>
      </div>
      <div class="cart-summary-row total">
        <span>Total</span>
        <span id="cart-total">₹0.00</span>
      </div>
      <button class="btn btn-primary btn-checkout" id="checkout-btn-drawer">Proceed to Checkout <i class="fa-solid fa-arrow-right"></i></button>
    </div>
  `;
  document.body.appendChild(cartDrawer);

  // Mobile menu toggle logic
  const menuToggle = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-menu");
  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", function() {
      navMenu.classList.toggle("active");
      const icon = menuToggle.querySelector("i");
      if (navMenu.classList.contains("active")) {
        icon.className = "fa-solid fa-xmark";
      } else {
        icon.className = "fa-solid fa-bars";
      }
    });
  }
}

// Injects the footer HTML dynamically
function injectFooter() {
  const footerContainer = document.getElementById("site-footer");
  if (!footerContainer) return;

  footerContainer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col footer-about">
          <img src="logo.png" alt="Coorg Harvest Logo" style="height: 70px; width: auto; object-fit: contain; margin-bottom: 20px; background: white; padding: 5px; border-radius: var(--border-radius-sm);">
          <p>Bringing you pure spices, handpicked teas, and raw honey straight from our plantations in the hills of Kodagu. 100% natural, sustainable, and direct.</p>
          <div class="social-links">
            <a href="#" target="_blank"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="#" target="_blank"><i class="fa-brands fa-instagram"></i></a>
            <a href="#" target="_blank"><i class="fa-brands fa-whatsapp"></i></a>
            <a href="#" target="_blank"><i class="fa-brands fa-youtube"></i></a>
          </div>
        </div>
        <div class="footer-col">
          <h3>Quick Links</h3>
          <ul class="footer-links">
            <li><a href="index.html">Home</a></li>
            <li><a href="shop.html">Shop Catalog</a></li>
            <li><a href="recipes.html">Recipes & Guides</a></li>
            <li><a href="about.html">Our Farm Story</a></li>
            <li><a href="faq.html">FAQs</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h3>Our Policy</h3>
          <ul class="footer-links">
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Shipping & Returns</a></li>
            <li><a href="#">Payment Methods</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h3>Contact Details</h3>
          <ul class="footer-contact">
            <li>
              <i class="fa-solid fa-location-dot"></i>
              <span>Bypass Road, Gonikopal, Kodagu, Karnataka - 571213</span>
            </li>
            <li>
              <i class="fa-solid fa-phone"></i>
              <span>+91 9880077218</span>
            </li>
            <li>
              <i class="fa-solid fa-envelope"></i>
              <span>info@coorgharvest.com</span>
            </li>
          </ul>
          <div class="footer-map-container">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15582.493920959141!2d75.9686001!3d12.172422!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba5bb6e18f2bbdb%3A0xe5a3c2005a76c7ee!2sGonikopal%2C%20Karnataka%20571213!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style="border:0;" 
              allowfullscreen="" 
              loading="lazy" 
              referrerpolicy="no-referrer-when-downgrade">
            </iframe>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} Coorg Harvest. All rights reserved. Sourced ethically from Western Ghats.</p>
        <div class="footer-bottom-links">
          <span>COD Available</span>
          <span>&middot;</span>
          <span>100% Secure UPI Gateway</span>
        </div>
      </div>
    </div>
  `;
}

// Injects the floating WhatsApp contact trigger
function injectWhatsAppWidget() {
  const wa = document.createElement("a");
  wa.href = "https://wa.me/919880077218?text=Hello%20Coorg%20Harvest,%20I'm%20interested%20in%20your%20spices%20and%20natural%20products!";
  wa.className = "whatsapp-float";
  wa.target = "_blank";
  wa.title = "Chat on WhatsApp";
  wa.innerHTML = `<i class="fa-brands fa-whatsapp"></i>`;
  document.body.appendChild(wa);
}

// Search Overlay Logic
function setupSearchOverlay() {
  const trigger = document.getElementById("search-trigger");
  const overlay = document.getElementById("search-overlay");
  const closeBtn = document.getElementById("search-close");
  const searchInput = document.getElementById("search-input");
  const resultsPreview = document.getElementById("search-results-preview");

  if (!trigger || !overlay || !closeBtn) return;

  trigger.addEventListener("click", function(e) {
    e.preventDefault();
    overlay.classList.add("active");
    setTimeout(() => searchInput.focus(), 300);
  });

  closeBtn.addEventListener("click", function() {
    overlay.classList.remove("active");
    searchInput.value = "";
    resultsPreview.classList.remove("active");
  });

  searchInput.addEventListener("input", function() {
    const query = this.value.trim().toLowerCase();
    if (query.length < 2) {
      resultsPreview.classList.remove("active");
      return;
    }

    const products = window.CoorgDB.getProducts();
    const matches = products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    ).slice(0, 5); // Limit to top 5 hits

    if (matches.length > 0) {
      resultsPreview.innerHTML = matches.map(p => `
        <a href="product.html?id=${p.id}" class="search-result-item">
          <img src="${p.image}" alt="${p.name}">
          <div class="search-result-item-info">
            <h4>${p.name}</h4>
            <span>₹${p.price}</span> &middot; <small>${p.category}</small>
          </div>
        </a>
      `).join('');
      resultsPreview.classList.add("active");
    } else {
      resultsPreview.innerHTML = `
        <div style="padding: 15px; text-align: center; color: #8A8170; font-size: 0.9rem;">
          No matching products found for "${query}"
        </div>
      `;
      resultsPreview.classList.add("active");
    }
  });

  // Escape key close
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && overlay.classList.contains("active")) {
      overlay.classList.remove("active");
      searchInput.value = "";
      resultsPreview.classList.remove("active");
    }
  });
}

// Shopping Cart slide out drawer implementation
function setupCartDrawer() {
  const trigger = document.getElementById("cart-trigger");
  const overlay = document.getElementById("cart-drawer-overlay");
  const drawer = document.getElementById("cart-drawer");
  const closeBtn = document.getElementById("cart-drawer-close");
  const checkoutBtn = document.getElementById("checkout-btn-drawer");
  const applyCouponBtn = document.getElementById("apply-coupon-btn");
  const couponInput = document.getElementById("coupon-code-input");

  if (!trigger || !overlay || !drawer || !closeBtn) return;

  // Open cart drawer function
  window.openCartDrawer = function() {
    drawer.classList.add("active");
    overlay.classList.add("active");
    renderCartItems();
  };

  trigger.addEventListener("click", function(e) {
    e.preventDefault();
    window.openCartDrawer();
  });

  closeBtn.addEventListener("click", function() {
    drawer.classList.remove("active");
    overlay.classList.remove("active");
  });

  overlay.addEventListener("click", function() {
    drawer.classList.remove("active");
    overlay.classList.remove("active");
  });

  checkoutBtn.addEventListener("click", function() {
    const cart = window.CoorgDB.getCart();
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    window.location.href = "checkout.html";
  });

  // Apply Coupon Action
  applyCouponBtn.addEventListener("click", function() {
    const code = couponInput.value.trim();
    const feedback = document.getElementById("coupon-msg-feedback");
    
    if (!code) {
      feedback.className = "coupon-status error";
      feedback.textContent = "Please enter a coupon code.";
      return;
    }

    const coupon = window.CoorgDB.validateCoupon(code);
    if (coupon) {
      localStorage.setItem("coorg_applied_coupon", JSON.stringify(coupon));
      feedback.className = "coupon-status success";
      feedback.textContent = `Coupon applied! ${coupon.description}`;
      renderCartItems();
    } else {
      feedback.className = "coupon-status error";
      feedback.textContent = "Invalid coupon code. Try 'COORG20' or 'FREESHIP'.";
    }
  });
}

// Render dynamic cart contents
function renderCartItems() {
  const itemsContainer = document.getElementById("cart-drawer-items");
  const subtotalEl = document.getElementById("cart-subtotal");
  const discountEl = document.getElementById("cart-discount");
  const discountRow = document.getElementById("coupon-discount-row");
  const discountLabel = document.getElementById("discount-label");
  const shippingEl = document.getElementById("cart-shipping");
  const totalEl = document.getElementById("cart-total");

  if (!itemsContainer) return;

  const cart = window.CoorgDB.getCart();

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-message">
        <i class="fa-solid fa-basket-shopping"></i>
        <p>Your basket is currently empty.</p>
        <a href="shop.html" class="btn btn-primary" style="margin-top: 20px; font-size: 0.85rem; padding: 10px 20px;">Shop Our Products</a>
      </div>
    `;
    subtotalEl.textContent = "₹0.00";
    discountRow.style.display = "none";
    shippingEl.textContent = "₹0.00";
    totalEl.textContent = "₹0.00";
    return;
  }

  // Populate Items HTML
  itemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-details">
        <h4>${item.name}</h4>
        <div class="cart-item-price">₹${item.price}</div>
        <div class="quantity-control">
          <button onclick="CoorgDB.updateCartQty('${item.id}', ${item.qty - 1})">-</button>
          <span>${item.qty}</span>
          <button onclick="CoorgDB.updateCartQty('${item.id}', ${item.qty + 1})">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="CoorgDB.removeFromCart('${item.id}')" title="Remove Item">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    </div>
  `).join('');

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;

  let discount = 0;
  const coupon = JSON.parse(localStorage.getItem("coorg_applied_coupon"));
  if (coupon) {
    if (coupon.type === "percent") {
      discount = subtotal * (coupon.value / 100);
      discountLabel.textContent = `${coupon.value}% off`;
    } else if (coupon.type === "fixed") {
      discount = Math.min(subtotal, coupon.value);
      discountLabel.textContent = `₹${coupon.value}`;
    }
    discountEl.textContent = `-₹${discount.toFixed(2)}`;
    discountRow.style.display = "flex";
  } else {
    discountRow.style.display = "none";
  }

  // Free delivery above 500, else flat 50
  const shipping = subtotal > 500 ? 0 : 50;
  shippingEl.textContent = shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`;

  const total = subtotal - discount + shipping;
  totalEl.textContent = `₹${total.toFixed(2)}`;
}
