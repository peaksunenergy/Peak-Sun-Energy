const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/clients
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.login, u.first_name, u.last_name
      FROM clients c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `);
    const clients = result.rows.map(formatClient);
    res.json(clients);
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/clients
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { login, password, firstName, lastName, phone, location, usage, power, characteristics, remark } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (login, password_hash, role, first_name, last_name)
       VALUES ($1, $2, 'client', $3, $4) RETURNING id`,
      [login, passwordHash, firstName, lastName]
    );
    const userId = userResult.rows[0].id;

    const clientResult = await client.query(
      `INSERT INTO clients (user_id, phone, location, usage, power, characteristics, state, remark)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7) RETURNING *`,
      [userId, phone, location, usage, power, characteristics, remark]
    );

    await client.query('COMMIT');
    res.status(201).json(formatClient({ ...clientResult.rows[0], login, first_name: firstName, last_name: lastName }));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Add client error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ce login existe déjà' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, location, usage, power, characteristics, state, remark } = req.body;

    const result = await pool.query(
      `UPDATE clients SET phone=$1, location=$2, usage=$3, power=$4,
              characteristics=$5, state=$6, remark=$7
       WHERE id=$8 RETURNING *`,
      [phone, location, usage, power, characteristics, state, remark, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    // Also update user names if provided
    if (firstName || lastName) {
      await pool.query(
        `UPDATE users SET first_name=COALESCE($1, first_name), last_name=COALESCE($2, last_name)
         WHERE id=$3`,
        [firstName, lastName, result.rows[0].user_id]
      );
    }

    res.json(formatClient(result.rows[0]));
  } catch (err) {
    console.error('Update client error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM clients WHERE id=$1 RETURNING user_id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    await pool.query('DELETE FROM users WHERE id=$1', [result.rows[0].user_id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete client error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/clients/:id/installation
router.get('/:id/installation', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.login, u.first_name, u.last_name
       FROM clients c JOIN users u ON c.user_id = u.id
       WHERE c.id=$1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.json(null);
    }
    res.json(formatClient(result.rows[0]));
  } catch (err) {
    console.error('Get installation error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

function formatClient(row) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    login: row.login,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    location: row.location,
    usage: row.usage,
    power: row.power,
    characteristics: row.characteristics,
    state: row.state,
    remark: row.remark,
    createdAt: row.created_at,
  };
}

module.exports = router;
