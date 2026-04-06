const express = require('express');
const supabase = require('../db/pool');

const router = express.Router();

// GET /api/notifications
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data.map(formatNotif));
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/notifications
router.post('/', async (req, res) => {
  try {
    const { type, claimId, message, forRoles } = req.body;
    const { data, error } = await supabase
      .from('notifications')
      .insert({ type, claim_id: claimId, message, for_roles: forRoles })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(formatNotif(data));
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
