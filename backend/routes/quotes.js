const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/quotes
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quote_requests ORDER BY created_at DESC');
    res.json(result.rows.map(formatQuote));
  } catch (err) {
    console.error('Get quotes error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/quotes
router.post('/', async (req, res) => {
  try {
    const { fullName, email, phone, clientType, message } = req.body;
    const result = await pool.query(
      `INSERT INTO quote_requests (full_name, email, phone, client_type, message, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [fullName, email, phone, clientType, message]
    );
    res.status(201).json(formatQuote(result.rows[0]));
  } catch (err) {
    console.error('Submit quote error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

function formatQuote(row) {
  return {
    id: String(row.id),
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    clientType: row.client_type,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

module.exports = router;
