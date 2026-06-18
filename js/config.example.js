// Coorg Harvest Configuration Template (Copy to config.js and add your real keys)
const CoorgConfig = {
  // Brand details
  PHONE_NUMBER: "+91 XXXXXXXXXX",
  WHATSAPP_LINK: "https://wa.me/XXXXXXXXXX",
  EMAIL: "info@yourdomain.com",
  ADDRESS: "Your Store Address, PIN, State, Country",
  GSTIN: "YOUR_GSTIN_NUMBER",
  
  // Analytics and marketing integrations
  GOOGLE_ANALYTICS_ID: "G-XXXXXXXXXX",
  META_PIXEL_ID: "YOUR_META_PIXEL_ID",
  
  // Payment gateway values
  UPI_VPA: "yourname@upi",
  RAZORPAY_KEY_ID: "rzp_test_YourRazorpayKeyHere",
  
  // Meta WhatsApp Business API endpoints
  WHATSAPP_API_ENDPOINT: "https://graph.facebook.com/vXX.X/YOUR_PHONE_ID/messages"
};

// Export to global scope
window.CoorgConfig = CoorgConfig;
