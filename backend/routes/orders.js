const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth');
const Razorpay = require('razorpay');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// POST /api/orders
router.post('/', verifyToken, async (req, res) => {
  const { table_number, items } = req.body;
  const user_id = req.user.user_id;

  if (!table_number || !items || items.length === 0) {
    return res.status(400).json({ error: 'Table number and items are required.' });
  }

  try {
    const [tables] = await db.query('SELECT * FROM tables_list WHERE table_number = ?', [table_number]);
    if (tables.length === 0) return res.status(404).json({ error: 'Invalid table number.' });

    const itemIds = items.map(i => i.menu_item_id);
    const [menuItems] = await db.query('SELECT * FROM menu_items WHERE id IN (?) AND is_available = TRUE', [itemIds]);
    if (menuItems.length !== itemIds.length) return res.status(400).json({ error: 'Some items are unavailable.' });

    const taxPercent = parseFloat(process.env.TAX_PERCENT) || 5;
    let subtotal = 0;
    const orderItems = [];

    for (const cartItem of items) {
      const dbItem = menuItems.find(m => m.id === cartItem.menu_item_id);
      subtotal += dbItem.price * cartItem.quantity;
      orderItems.push({ menu_item_id: dbItem.id, name: dbItem.name, quantity: cartItem.quantity, price_at_time: dbItem.price });
    }

    const tax = parseFloat((subtotal * taxPercent / 100).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    const [orderResult] = await db.query(
      'INSERT INTO orders (user_id, table_number, subtotal, tax, total) VALUES (?, ?, ?, ?, ?)',
      [user_id, table_number, subtotal, tax, total]
    );
    const order_id = orderResult.insertId;

    for (const oi of orderItems) {
      await db.query(
        'INSERT INTO order_items (order_id, menu_item_id, name, quantity, price_at_time) VALUES (?, ?, ?, ?, ?)',
        [order_id, oi.menu_item_id, oi.name, oi.quantity, oi.price_at_time]
      );
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: `order_${order_id}`
    });

    res.json({
      message: 'Order created.',
      order_id,
      table_number,
      subtotal,
      tax,
      total,
      items: orderItems,
      razorpay_order_id: razorpayOrder.id,
      razorpay_key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/orders/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.user_id]);
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found.' });
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ order: orders[0], items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;