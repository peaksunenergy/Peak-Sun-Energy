const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/notifications
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    res.json(result.rows.map(formatNotif));
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/notifications
router.post('/', async (req, res) => {
  try {
    const { type, claimId, message, forRoles } = req.body;
    const result = await pool.query(
      `INSERT INTO notifications (type, claim_id, message, for_roles)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [type, claimId, message, forRoles]
    );
    res.status(201).json(formatNotif(result.rows[0]));
  } catch (err) {
    console.error('Add notification error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

function formatNotif(row) {
  return {
    id: String(row.id),
    type: row.type,
    claimId: row.claim_id ? String(row.claim_id) : null,
    message: row.message,
    forRoles: row.for_roles,
    read: row.read,
    createdAt: row.created_at,
  };
}

module.exports = router;
