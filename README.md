# Coorg Harvest - Premium E-Commerce Website

A premium, nature-inspired e-commerce platform for **Coorg Harvest**, a brand specializing in authentic spices, shade-grown single-estate coffee, raw forest honey, herbal teas, and wellness products sourced directly from local farmers in Kodagu (Coorg), Karnataka, India.

This project is built using HTML5, Vanilla CSS3, Express.js (Node.js backend), and custom client-side persistence for an interactive simulated e-commerce experience.

---

## 🌿 Brand Information & Story

Coorg Harvest brings the authentic flavors and wellness traditions of Kodagu directly to customers. Every product is handpicked, chemical-free, and reflects the purity, sustainability, and natural richness of the Western Ghats.
*   **Customer Support & WhatsApp:** +91 9880077218
*   **Operational Sourcing Hub:** Bypass Road, Gonikopal, Kodagu, Karnataka - 571213

---

## 🛠️ Technology Stack

*   **Frontend Core:** HTML5, Vanilla JS, Google Fonts (*Playfair Display* & *Outfit*), FontAwesome Icons.
*   **Styling Engine:** Custom Vanilla CSS3 (Custom properties, grid, flex, fluid responsive states).
*   **Backend Server:** Express.js (Node.js runtime) for static file routing, custom route mappings, and dotenv variables.
*   **Database (Simulated):** LocalStorage API acting as a persistent client-side database (supports products, orders ledger, activity logs, dynamic cart counters, and reviews).
*   **Invoice Generation:** Client-side `jsPDF` API generating official tax receipts (CGST/SGST details, QR stamps, packing logs).
*   **Version Control & Flow:** Git version control linked to GitHub.

---

## 📁 Repository Directory Structure

```text
f:/web/coorg harvest/
├── index.html            # Cinematic Homepage (Why Choose Us, Testimonials)
├── shop.html             # Advanced Product Catalog & Sidebar Filters
├── product.html          # Dynamic Product Details (Reviews, tabs)
├── checkout.html         # Secure checkout page & UPI payment mock
├── order-success.html    # Success receipts & WhatsApp notifications logs
├── about.html            # Stories of farmers and shade coffee
├── recipes.html          # South Indian coffee & tea brewing instructions
├── faq.html              # Collapsible Q&A with live search filtering
├── admin.html            # Operations Dashboard Portal (KPIs, Charts)
├── admin-login.html      # Secure admin auth gateway (SHA-256 hash, 2FA,Lockout)
├── logo.png              # Official Coorg Harvest Brand Emblem
├── package.json          # Node dependencies & package scripts
├── server.js             # Express static web server
├── .gitignore            # Git exclusion rules
├── .env.example          # Server environment variable template
├── css/
│   └── style.css         # Premium global stylesheet and design system
└── js/
    ├── config.js         # Client-side configuration settings (Git-ignored)
    ├── config.example.js # Template client-side configuration file
    ├── db.js             # Shared local storage database & seeded catalog
    └── admin.js          # Admin CRUD ledger and logout watcher
```

---

## 🔑 Environment Variables & Security Configurations

To secure administrative credentials and payment API credentials, configuration values are separated into environment templates.

### 1. Backend Environment Template (`.env.example`)
Copy `.env.example` to `.env` in the root directory:
```ini
DATABASE_URL=postgresql://username:password@localhost:5432/coorg_harvest
JWT_SECRET=super_secret_jwt_token_key_change_me
SESSION_SECRET=super_secret_session_key_change_me
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend_username
SMTP_PASS=resend_password
RAZORPAY_KEY_ID=rzp_test_CoorgHarvestMockKey
RAZORPAY_KEY_SECRET=rzp_secret_CoorgHarvestMockSecret
WHATSAPP_API_TOKEN=meta_whatsapp_api_token_here
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
META_PIXEL_ID=pixel_id_here
```

### 2. Frontend Configuration Template (`js/config.example.js`)
Copy `js/config.example.js` to `js/config.js` in the JavaScript folder:
```javascript
const CoorgConfig = {
  PHONE_NUMBER: "+91 XXXXXXXXXX",
  WHATSAPP_LINK: "https://wa.me/XXXXXXXXXX",
  EMAIL: "info@yourdomain.com",
  ADDRESS: "Your Store Address, PIN, State, Country",
  GSTIN: "YOUR_GSTIN_NUMBER",
  GOOGLE_ANALYTICS_ID: "G-XXXXXXXXXX",
  META_PIXEL_ID: "YOUR_META_PIXEL_ID",
  UPI_VPA: "yourname@upi",
  RAZORPAY_KEY_ID: "rzp_test_YourRazorpayKeyHere"
};
```
*Note: `js/config.js` is added to `.gitignore` to prevent committing sensitive keys to GitHub.*

---

## 🚀 Local Installation & Development

To run this project locally, ensure you have [Node.js](https://nodejs.org/) installed:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/shazaki112-svg/coorg-harvest.git
    cd coorg-harvest
    ```
2.  **Configure environment files:**
    *   Duplicate `.env.example` and name it `.env`
    *   Duplicate `js/config.example.js` and name it `js/config.js`
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Launch the development server:**
    *   Using hot-reloads (Nodemon):
        ```bash
        npm run dev
        ```
    *   Standard start:
        ```bash
        npm start
        ```
5.  **Open browser:**
    Navigate to `http://localhost:3000` to view the public storefront.

---

## 🔒 Administrator Authentication Details

The Admin Panel has been completely decoupled from public-facing customer menus and is protected by a login gateway.
*   **Admin Entry URL:** `/admin` (Redirects to `/admin-login.html`)
*   **Default Credentials:**
    *   *Username:* `coorg_harvest`
    *   *Password:* `fizal@9902?*&12`

### Security Operations:
1.  **Web Crypto Hashing:** Passwords entered on the login gateway are hashed with SHA-256 client-side before matching against the secure database hash.
2.  **Lockout Lock Trigger:** Exceeding 5 failed login attempts logs security audits and locks the form for 5 minutes with a live countdown clock.
3.  **Two-Factor Authentication (OTP):** Successfully validated credentials prompt a 2FA OTP prompt (OTP token is set as `808080`).
4.  **Inactivity Timer:** Inactive users on the admin panel for 30 minutes are automatically logged out, and audit logs are recorded.

---

## 📦 Deployment Instructions

This repository is ready for automatic deployment via GitHub integrations with hosts like **Vercel, Netlify, Render, or Heroku**.

### Vercel / Netlify (Static Hosting)
1.  Connect your GitHub repository to Vercel/Netlify.
2.  Set the **Build Command** to: `npm run build` or leave blank.
3.  Set the **Output Directory** to: `./` (root).
4.  Define environment variables corresponding to `js/config.js` values if compiling statically.

### Render / Heroku / Caprover (Node Web Hosting)
1.  Connect your repository to Render or Heroku.
2.  Set the **Build Command** to: `npm install`
3.  Set the **Start Command** to: `npm start`
4.  Add variables from `.env.example` to the host environment variables section.
