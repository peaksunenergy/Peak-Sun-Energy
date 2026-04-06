const express = require('express');
const supabase = require('../db/pool');

const router = express.Router();
const CLAIM_ALERT_DELAY_MS = 48 * 60 * 60 * 1000;

// GET /api/claims
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data.map(formatClaim));
  } catch (err) {
    console.error('Get claims error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/claims/client/:clientId
router.get('/client/:clientId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('client_id', req.params.clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data.map(formatClaim));
  } catch (err) {
    console.error('Get client claims error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/claims
router.post('/', async (req, res) => {
  try {
    const { clientId, clientName, type, description, photoUri } = req.body;
    const { data: claim, error } = await supabase
      .from('claims')
      .insert({ client_id: clientId, client_name: clientName, type, description, photo_uri: photoUri, status: 'created' })
      .select()
      .single();

    if (error) throw error;

    // Add notification
    const forRoles = type === 'technical' ? ['technician', 'admin'] : ['admin'];
    const typeLabel = type === 'technical' ? 'technique' : 'administrative';
    await supabase
      .from('notifications')
      .insert({ type: 'new_claim', claim_id: claim.id, message: `Nouvelle réclamation ${typeLabel} de ${clientName}`, for_roles: forRoles });

    res.status(201).json(formatClaim(claim));
  } catch (err) {
    console.error('Submit claim error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/claims/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { data: claim, error } = await supabase
      .from('claims')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!claim) return res.status(404).json({ error: 'Réclamation non trouvée' });

    res.json(formatClaim(claim));
  } catch (err) {
    console.error('Update claim status error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/claims/overdue
router.get('/overdue', async (_req, res) => {
  try {
    const cutoff = new Date(Date.now() - CLAIM_ALERT_DELAY_MS).toISOString();
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('status', 'created')
      .eq('type', 'technical')
      .lt('created_at', cutoff);

    if (error) throw error;

    for (const claim of data) {
      await supabase
        .from('notifications')
        .insert({
          type: 'overdue_claim',
          claim_id: claim.id,
          message: `⚠️ Réclamation #${claim.id} non traitée depuis plus de 48h`,
          for_roles: ['admin'],
        });
    }

    res.json(data.map(formatClaim));
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
