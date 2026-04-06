const express = require('express');
const supabase = require('../db/pool');
const { sendEscalationEmail } = require('../services/email');

const router = express.Router();
const CLAIM_ALERT_DELAY_MS = 48 * 60 * 60 * 1000;

// --- Helper: add audit trail entry ---
async function addHistory(claimId, action, fromVal, toVal, userId, userName, note) {
  await supabase.from('claim_history').insert({
    claim_id: claimId,
    action,
    from_value: fromVal,
    to_value: toVal,
    performed_by: userId,
    performer_name: userName,
    note,
  });
}

// GET /api/claims
router.get('/', async (req, res) => {
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

// GET /api/claims/client/:clientId — :clientId is actually user_id from auth
router.get('/client/:clientId', async (req, res) => {
  try {
    // Look up actual client.id from user_id
    const { data: clientRow } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', parseInt(req.params.clientId))
      .single();

    if (!clientRow) return res.json([]);

    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('client_id', clientRow.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data.map(formatClaim));
  } catch (err) {
    console.error('Get client claims error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/claims/assigned/:techId — claims assigned to a technician
router.get('/assigned/:techId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('assigned_to', parseInt(req.params.techId))
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data.map(formatClaim));
  } catch (err) {
    console.error('Get assigned claims error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/claims/:id/history — full audit trail
router.get('/:id/history', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('claim_history')
      .select('*')
      .eq('claim_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json(data.map(h => ({
      id: String(h.id),
      claimId: String(h.claim_id),
      action: h.action,
      fromValue: h.from_value,
      toValue: h.to_value,
      performedBy: h.performed_by ? String(h.performed_by) : null,
      performerName: h.performer_name,
      note: h.note,
      createdAt: h.created_at,
    })));
  } catch (err) {
    console.error('Get claim history error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/claims
router.post('/', async (req, res) => {
  try {
    const { clientId, clientName, type, description, photoUri } = req.body;

    // clientId is user_id from auth — resolve to actual clients.id
    const { data: clientRow } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', parseInt(clientId))
      .single();

    const actualClientId = clientRow ? clientRow.id : parseInt(clientId);

    const { data: claim, error } = await supabase
      .from('claims')
      .insert({ client_id: actualClientId, client_name: clientName, type, description, photo_uri: photoUri, status: 'created' })
      .select()
      .single();

    if (error) throw error;

    // Audit: created
    await addHistory(claim.id, 'created', null, 'created', null, clientName, 'Réclamation créée par le client');

    // Notification — always notify technicians and admin
    const typeLabel = type === 'technical' ? 'technique' : 'administrative';
    await supabase
      .from('notifications')
      .insert({ type: 'new_claim', claim_id: claim.id, message: `Nouvelle réclamation ${typeLabel} de ${clientName}`, for_roles: ['technician', 'admin'] });

    res.status(201).json(formatClaim(claim));
  } catch (err) {
    console.error('Submit claim error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/claims/:id/status — change status (with audit)
router.put('/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const user = req.user;

    // Get current claim
    const { data: current } = await supabase
      .from('claims')
      .select('status, assigned_name')
      .eq('id', req.params.id)
      .single();

    const oldStatus = current?.status;
    const performerName = `${user.login}`;

    const { data: claim, error } = await supabase
      .from('claims')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!claim) return res.status(404).json({ error: 'Réclamation non trouvée' });

    // Audit: status change
    await addHistory(claim.id, 'status_change', oldStatus, status, parseInt(user.id), performerName, note || null);

    res.json(formatClaim(claim));
  } catch (err) {
    console.error('Update claim status error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/claims/:id/assign — assign to a technician
router.put('/:id/assign', async (req, res) => {
  try {
    const { technicianId, technicianName, note } = req.body;
    const user = req.user;

    // Get current assignment
    const { data: current } = await supabase
      .from('claims')
      .select('assigned_to, assigned_name, status')
      .eq('id', req.params.id)
      .single();

    const oldAssignee = current?.assigned_name || 'Non assigné';
    const newStatus = current?.status === 'created' ? 'in_progress' : current?.status;

    const { data: claim, error } = await supabase
      .from('claims')
      .update({
        assigned_to: parseInt(technicianId),
        assigned_name: technicianName,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Audit: assigned
    await addHistory(claim.id, 'assigned', oldAssignee, technicianName, parseInt(user.id), user.login, note || null);

    // If status also changed
    if (current?.status === 'created') {
      await addHistory(claim.id, 'status_change', 'created', 'in_progress', parseInt(user.id), user.login, 'Statut mis à jour automatiquement lors de l\'assignation');
    }

    // Notification to technician
    await supabase.from('notifications').insert({
      type: 'claim_assigned',
      claim_id: claim.id,
      message: `Réclamation #${claim.id} vous a été assignée`,
      for_roles: ['technician'],
    });

    res.json(formatClaim(claim));
  } catch (err) {
    console.error('Assign claim error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/claims/:id/forward — forward to another technician
router.put('/:id/forward', async (req, res) => {
  try {
    const { technicianId, technicianName, reason } = req.body;
    const user = req.user;

    // Get current assignment
    const { data: current } = await supabase
      .from('claims')
      .select('assigned_to, assigned_name')
      .eq('id', req.params.id)
      .single();

    const oldAssignee = current?.assigned_name || 'Non assigné';

    const { data: claim, error } = await supabase
      .from('claims')
      .update({
        assigned_to: parseInt(technicianId),
        assigned_name: technicianName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Audit: forwarded
    await addHistory(claim.id, 'forwarded', oldAssignee, technicianName, parseInt(user.id), user.login, reason || 'Transféré à un autre technicien');

    // Notifications
    await supabase.from('notifications').insert([
      {
        type: 'claim_forwarded',
        claim_id: claim.id,
        message: `Réclamation #${claim.id} transférée de ${oldAssignee} à ${technicianName}`,
        for_roles: ['admin'],
      },
      {
        type: 'claim_assigned',
        claim_id: claim.id,
        message: `Réclamation #${claim.id} vous a été transférée par ${user.login}`,
        for_roles: ['technician'],
      },
    ]);

    res.json(formatClaim(claim));
  } catch (err) {
    console.error('Forward claim error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/claims/overdue — check & escalate claims > 48h
router.get('/overdue', async (_req, res) => {
  try {
    const cutoff = new Date(Date.now() - CLAIM_ALERT_DELAY_MS).toISOString();
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .in('status', ['created', 'in_progress'])
      .eq('escalated', false)
      .lt('created_at', cutoff);

    if (error) throw error;

    for (const claim of data) {
      // Mark as escalated
      await supabase.from('claims').update({ escalated: true }).eq('id', claim.id);

      // Audit: escalated
      await addHistory(claim.id, 'escalated', null, 'admin', null, 'Système', 'Escalade automatique — non traité depuis +48h');

      // Notification
      await supabase.from('notifications').insert({
        type: 'overdue_claim',
        claim_id: claim.id,
        message: `⚠️ Réclamation #${claim.id} non traitée depuis plus de 48h — escaladée`,
        for_roles: ['admin'],
      });

      // Send email to admin
      await sendEscalationEmail(claim).catch(err => console.error('Email error:', err.message));
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
    assignedTo: row.assigned_to ? String(row.assigned_to) : null,
    assignedName: row.assigned_name || null,
    escalated: row.escalated || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = router;
