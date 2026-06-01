const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/menu — all items grouped by category
router.get('/', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY id');
    const [items] = await db.query(
      'SELECT * FROM menu_items WHERE is_available = TRUE ORDER BY category_id, name'
    );

    const menu = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      items: items.filter(item => item.category_id === cat.id)
    })).filter(cat => cat.items.length > 0);

    res.json(menu);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/menu/validate-table/:number
router.get('/validate-table/:number', async (req, res) => {
  const tableNumber = parseInt(req.params.number);
  try {
    const [rows] = await db.query(
      'SELECT * FROM tables_list WHERE table_number = ?',
      [tableNumber]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Table not found.' });
    }
    res.json({ valid: true, table_number: tableNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
