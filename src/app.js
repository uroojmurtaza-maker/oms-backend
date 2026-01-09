const express = require('express');
const cors = require('cors'); // Install if needed: npm install cors
const routes = require('./routes');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Add this after express()
app.use(cors({
  origin: 'http://localhost:5173',  // Your frontend URL
  credentials: true,                // If using cookies (not needed for JWT in header)
}));

// Mount all routes under /api
app.use('/api', routes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to OMS Backend' });
});

module.exports = app;