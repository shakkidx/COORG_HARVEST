const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets from the current directory
app.use(express.static(path.join(__dirname)));

// Dynamic route fallbacks (optional)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.listen(PORT, () => {
  console.log(`🌿 Coorg Harvest web server running on port ${PORT}`);
  console.log(`   Local Address: http://localhost:${PORT}`);
});
