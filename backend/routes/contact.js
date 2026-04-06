const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/contact
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json(result.rows.map(formatMessage));
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;
    const result = await pool.query(
      `INSERT INTO contact_messages (full_name, email, phone, message)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [fullName, email, phone, message]
    );
    res.status(201).json(formatMessage(result.rows[0]));
  } catch (err) {
    console.error('Submit message error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

function formatMessage(row) {
  return {
    id: String(row.id),
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    createdAt: row.created_at,
  };
}

module.exports = router;
