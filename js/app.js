// GLOBAL INTERACTIONS - COORG HARVEST
document.addEventListener("DOMContentLoaded", async function() {
  // Initialize and sync database from server
  await window.CoorgDB.init();

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
  injectMobileBottomNav();
  injectBackToTop();

  // 6. INITIALIZE SPLIT SCREEN HERO SLIDER
  initializeHeroSlider();

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
          <img src="logo.png" alt="Coorg Harvest" class="header-logo-img">
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
          <div class="footer-logo-wrapper" style="display: inline-block; background: var(--white); padding: 8px 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid var(--accent-gold);">
            <img src="logo.png" alt="Coorg Harvest Logo" style="height: 60px; width: auto; object-fit: contain; display: block;">
          </div>
          <p style="line-height: 1.6; margin-bottom: 20px; color: rgba(247, 243, 232, 0.75); font-size: 0.9rem;">Bringing you pure spices, handpicked teas, single-estate coffees, and raw forest honey straight from our family-run plantations in Kodagu. 100% natural and direct.</p>
          <div class="social-links">
            <a href="#" target="_blank"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="${window.CoorgConfig.INSTAGRAM_LINK || '#'}" target="_blank"><i class="fa-brands fa-instagram"></i></a>
            <a href="${window.CoorgConfig.WHATSAPP_LINK || '#'}" target="_blank"><i class="fa-brands fa-whatsapp"></i></a>
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
          
          <div class="trust-badges" style="margin-top: 25px; display: flex; gap: 20px;">
            <div class="badge-item" style="text-align: center; color: rgba(247,243,232,0.75); font-size: 0.75rem; flex: 1;">
              <i class="fa-solid fa-leaf" style="color: var(--accent-gold); font-size: 1.3rem; display: block; margin-bottom: 5px;"></i>
              100% Organic
            </div>
            <div class="badge-item" style="text-align: center; color: rgba(247,243,232,0.75); font-size: 0.75rem; flex: 1;">
              <i class="fa-solid fa-handshake" style="color: var(--accent-gold); font-size: 1.3rem; display: block; margin-bottom: 5px;"></i>
              Direct Sourced
            </div>
            <div class="badge-item" style="text-align: center; color: rgba(247,243,232,0.75); font-size: 0.75rem; flex: 1;">
              <i class="fa-solid fa-award" style="color: var(--accent-gold); font-size: 1.3rem; display: block; margin-bottom: 5px;"></i>
              Pure Quality
            </div>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} Coorg Harvest. All rights reserved. Sourced ethically from the Western Ghats.</p>
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

// Injects the mobile sticky bottom navigation bar
function injectMobileBottomNav() {
  const currentPath = window.location.pathname;
  const isHome = currentPath.endsWith("index.html") || currentPath.endsWith("/") || currentPath === "";
  
  const bottomNav = document.createElement("div");
  bottomNav.className = "mobile-bottom-nav";
  bottomNav.innerHTML = `
    <a href="index.html" class="mobile-nav-item ${isHome ? 'active' : ''}">
      <i class="fa-solid fa-house"></i>
      <span>Home</span>
    </a>
    <a href="index.html#categories" id="mobile-nav-categories" class="mobile-nav-item">
      <i class="fa-solid fa-list"></i>
      <span>Categories</span>
    </a>
    <a href="#" id="mobile-nav-search" class="mobile-nav-item">
      <i class="fa-solid fa-magnifying-glass"></i>
      <span>Search</span>
    </a>
    <a href="#" id="mobile-nav-cart" class="mobile-nav-item">
      <i class="fa-solid fa-bag-shopping"></i>
      <span class="badge cart-count-badge" style="display: none;">0</span>
      <span>Cart</span>
    </a>
  `;
  document.body.appendChild(bottomNav);

  // Setup event listeners
  setupMobileBottomNav();
}

// Setup event listeners for mobile bottom navigation triggers
function setupMobileBottomNav() {
  const categoriesBtn = document.getElementById("mobile-nav-categories");
  if (categoriesBtn) {
    categoriesBtn.addEventListener("click", function(e) {
      const currentPath = window.location.pathname;
      const isHome = currentPath.endsWith("index.html") || currentPath.endsWith("/") || currentPath === "";
      if (isHome) {
        e.preventDefault();
        const categoriesSection = document.getElementById("categories");
        if (categoriesSection) {
          categoriesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  const searchBtn = document.getElementById("mobile-nav-search");
  if (searchBtn) {
    searchBtn.addEventListener("click", function(e) {
      e.preventDefault();
      const searchTrigger = document.getElementById("search-trigger");
      if (searchTrigger) {
        searchTrigger.click();
      }
    });
  }

  const cartBtn = document.getElementById("mobile-nav-cart");
  if (cartBtn) {
    cartBtn.addEventListener("click", function(e) {
      e.preventDefault();
      if (window.openCartDrawer) {
        window.openCartDrawer();
      }
    });
  }
}

// Injects back to top button and handles its scroll/click actions
function injectBackToTop() {
  const btn = document.createElement("a");
  btn.href = "#";
  btn.className = "back-to-top";
  btn.id = "back-to-top";
  btn.innerHTML = `<i class="fa-solid fa-arrow-up"></i>`;
  document.body.appendChild(btn);

  btn.addEventListener("click", function(e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", function() {
    if (window.scrollY > 400) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
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

// Controls, autoplay, and swipe transitions for the split hero slider
function initializeHeroSlider() {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".slider-dots .dot");
  const prevBtn = document.querySelector(".prev-slide");
  const nextBtn = document.querySelector(".next-slide");
  
  if (slides.length === 0) return;

  let currentSlide = 0;
  let autoplayTimer = null;
  const autoplayInterval = 6000; // 6 seconds

  function showSlide(index) {
    // Remove active classes
    slides.forEach(slide => slide.classList.remove("active"));
    dots.forEach(dot => dot.classList.remove("active"));

    // Wrap-around index
    if (index >= slides.length) {
      currentSlide = 0;
    } else if (index < 0) {
      currentSlide = slides.length - 1;
    } else {
      currentSlide = index;
    }

    // Add active classes
    slides[currentSlide].classList.add("active");
    if (dots[currentSlide]) {
      dots[currentSlide].classList.add("active");
    }
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
    resetAutoplay();
  }

  function prevSlide() {
    showSlide(currentSlide - 1);
    resetAutoplay();
  }

  function startAutoplay() {
    autoplayTimer = setInterval(nextSlide, autoplayInterval);
  }

  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }

  // Bind chevron arrows
  if (prevBtn) {
    prevBtn.addEventListener("click", function(e) {
      e.preventDefault();
      prevSlide();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function(e) {
      e.preventDefault();
      nextSlide();
    });
  }

  // Bind dots
  dots.forEach((dot, idx) => {
    dot.addEventListener("click", function(e) {
      e.preventDefault();
      showSlide(idx);
      resetAutoplay();
    });
  });

  // Touch swipe gesture support for mobile viewport
  let touchStartX = 0;
  let touchEndX = 0;
  const sliderContainer = document.querySelector(".hero-slider");

  if (sliderContainer) {
    sliderContainer.addEventListener("touchstart", function(e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    sliderContainer.addEventListener("touchend", function(e) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    if (touchStartX - touchEndX > swipeThreshold) {
      nextSlide(); // Swiped left
    } else if (touchEndX - touchStartX > swipeThreshold) {
      prevSlide(); // Swiped right
    }
  }

  // Initialize slider auto-rotation loop
  startAutoplay();
}
