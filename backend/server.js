const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));


app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/login.html')));
app.get('/table', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/table.html')));
app.get('/menu', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/menu.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/cart.html')));
app.get('/confirmation', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/confirmation.html')));
app.get('/review', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/review.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
