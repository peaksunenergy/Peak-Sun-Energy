const express = require('express');
const pool = require('../db/pool');

const router = express.Router();
const CLAIM_ALERT_DELAY_MS = 48 * 60 * 60 * 1000;

// GET /api/claims
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM claims ORDER BY created_at DESC');
    res.json(result.rows.map(formatClaim));
  } catch (err) {
    console.error('Get claims error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/claims/client/:clientId
router.get('/client/:clientId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM claims WHERE client_id=$1 ORDER BY created_at DESC',
      [req.params.clientId]
    );
    res.json(result.rows.map(formatClaim));
  } catch (err) {
    console.error('Get client claims error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/claims
router.post('/', async (req, res) => {
  try {
    const { clientId, clientName, type, description, photoUri } = req.body;
    const result = await pool.query(
      `INSERT INTO claims (client_id, client_name, type, description, photo_uri, status)
       VALUES ($1, $2, $3, $4, $5, 'created') RETURNING *`,
      [clientId, clientName, type, description, photoUri]
    );
    const claim = formatClaim(result.rows[0]);

    // Add notification
    const forRoles = type === 'technical' ? ['technician', 'admin'] : ['admin'];
    const typeLabel = type === 'technical' ? 'technique' : 'administrative';
    await pool.query(
      `INSERT INTO notifications (type, claim_id, message, for_roles)
       VALUES ('new_claim', $1, $2, $3)`,
      [claim.id, `Nouvelle réclamation ${typeLabel} de ${clientName}`, forRoles]
    );

    res.status(201).json(claim);
  } catch (err) {
    console.error('Submit claim error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/claims/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      `UPDATE claims SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Réclamation non trouvée' });
    }
    res.json(formatClaim(result.rows[0]));
  } catch (err) {
    console.error('Update claim status error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/claims/overdue
router.get('/overdue', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM claims
       WHERE status='created' AND type='technical'
         AND created_at < NOW() - INTERVAL '${CLAIM_ALERT_DELAY_MS} milliseconds'`
    );

    for (const claim of result.rows) {
      await pool.query(
        `INSERT INTO notifications (type, claim_id, message, for_roles)
         VALUES ('overdue_claim', $1, $2, $3)`,
        [claim.id, `⚠️ Réclamation #${claim.id} non traitée depuis plus de 48h`, ['admin']]
      );
    }

    res.json(result.rows.map(formatClaim));
  } catch (err) {
    console.error('Check overdue error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

function formatClaim(row) {
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    clientName: row.client_name,
    type: row.type,
    description: row.description,
    photoUri: row.photo_uri,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = router;
