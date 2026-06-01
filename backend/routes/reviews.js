const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth');

// POST /api/reviews/like/:item_id — toggle like
router.post('/like/:item_id', verifyToken, async (req, res) => {
  const user_id = req.user.user_id;
  const menu_item_id = parseInt(req.params.item_id);
  try {
    const [existing] = await db.query(
      'SELECT id FROM food_likes WHERE user_id = ? AND menu_item_id = ?', [user_id, menu_item_id]
    );
    if (existing.length > 0) {
      await db.query('DELETE FROM food_likes WHERE user_id = ? AND menu_item_id = ?', [user_id, menu_item_id]);
    } else {
      await db.query('INSERT INTO food_likes (user_id, menu_item_id) VALUES (?, ?)', [user_id, menu_item_id]);
    }
    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM food_likes WHERE menu_item_id = ?', [menu_item_id]);
    res.json({ liked: existing.length === 0, count: parseInt(count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/reviews/likes?item_ids=1,2,3
router.get('/likes', verifyToken, async (req, res) => {
  const user_id = req.user.user_id;
  const ids = (req.query.item_ids || '').split(',').map(Number).filter(Boolean);
  if (ids.length === 0) return res.json([]);
  try {
    const [counts] = await db.query(
      'SELECT menu_item_id, COUNT(*) as count FROM food_likes WHERE menu_item_id IN (?) GROUP BY menu_item_id', [ids]
    );
    const [userLikes] = await db.query(
      'SELECT menu_item_id FROM food_likes WHERE user_id = ? AND menu_item_id IN (?)', [user_id, ids]
    );
    const likedSet = new Set(userLikes.map(l => l.menu_item_id));
    const countMap = {};
    counts.forEach(c => countMap[c.menu_item_id] = parseInt(c.count));
    res.json(ids.map(id => ({ menu_item_id: id, count: countMap[id] || 0, liked: likedSet.has(id) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/reviews — submit review (verified purchase)
router.post('/', verifyToken, async (req, res) => {
  const user_id = req.user.user_id;
  const { menu_item_id, order_id, stars, comment } = req.body;
  if (!menu_item_id || !order_id || !stars) return res.status(400).json({ error: 'menu_item_id, order_id and stars are required.' });
  if (stars < 1 || stars > 5) return res.status(400).json({ error: 'Stars must be between 1 and 5.' });
  try {
    const [check] = await db.query(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.id = ? AND o.user_id = ? AND oi.menu_item_id = ?`,
      [order_id, user_id, menu_item_id]
    );
    if (check.length === 0) return res.status(403).json({ error: 'You can only review items you have ordered.' });

    await db.query(
      `INSERT INTO food_reviews (user_id, menu_item_id, order_id, stars, comment)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE stars = VALUES(stars), comment = VALUES(comment)`,
      [user_id, menu_item_id, order_id, stars, comment || null]
    );
    res.json({ message: 'Review submitted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/reviews/:item_id — MUST be last to avoid catching /like and /likes
router.get('/:item_id', async (req, res) => {
  const menu_item_id = parseInt(req.params.item_id);
  try {
    const [reviews] = await db.query(
      `SELECT fr.stars, fr.comment, fr.created_at,
              CONCAT(LEFT(u.phone, 4), '******') as phone_masked
       FROM food_reviews fr JOIN users u ON u.id = fr.user_id
       WHERE fr.menu_item_id = ? ORDER BY fr.created_at DESC`,
      [menu_item_id]
    );
    const [[{ avg_stars, total }]] = await db.query(
      'SELECT AVG(stars) as avg_stars, COUNT(*) as total FROM food_reviews WHERE menu_item_id = ?',
      [menu_item_id]
    );
    res.json({ avg_stars: avg_stars ? parseFloat(avg_stars).toFixed(1) : null, total: parseInt(total), reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
