const express = require('express');
const supabase = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/quotes
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data.map(formatQuote));
  } catch (err) {
    console.error('Get quotes error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/quotes/assigned/:userId — quotes assigned to a specific user
router.get('/assigned/:userId', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('assigned_to', req.params.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data.map(formatQuote));
  } catch (err) {
    console.error('Get assigned quotes error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/quotes
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, phone, clientType, serviceType, location, power, stegAmount, stegPower } = req.body;
    const { data, error } = await supabase
      .from('quote_requests')
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone,
        client_type: clientType,
        service_type: serviceType,
        location,
        power,
        steg_amount: stegAmount,
        steg_power: stegPower,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(formatQuote(data));
  } catch (err) {
    console.error('Submit quote error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/quotes/:id/status — update quote status
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from('quote_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Devis non trouvé' });
    res.json(formatQuote(data));
  } catch (err) {
    console.error('Update quote status error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/quotes/:id/assign — assign quote to technician or admin
router.put('/:id/assign', authMiddleware, async (req, res) => {
  try {
    const { assignedTo, assignedName } = req.body;

    // Block assigning to the same person
    const { data: current } = await supabase
      .from('quote_requests')
      .select('status, assigned_to')
      .eq('id', req.params.id)
      .single();

    if (current && current.assigned_to === parseInt(assignedTo)) {
      return res.status(400).json({ error: 'Ce devis est déjà assigné à cette personne' });
    }

    const updates = {
      assigned_to: parseInt(assignedTo),
      assigned_name: assignedName,
      updated_at: new Date().toISOString(),
    };
    // Auto move to in_progress if still pending
    if (current && current.status === 'pending') {
      updates.status = 'in_progress';
    }

    const { data, error } = await supabase
      .from('quote_requests')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Devis non trouvé' });
    res.json(formatQuote(data));
  } catch (err) {
    console.error('Assign quote error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/quotes/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('quote_requests')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Devis supprimé' });
  } catch (err) {
    console.error('Delete quote error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

function formatQuote(row) {
  return {
    id: String(row.id),
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    clientType: row.client_type,
    serviceType: row.service_type,
    location: row.location,
    power: row.power,
    stegAmount: row.steg_amount,
    stegPower: row.steg_power,
    status: row.status,
    assignedTo: row.assigned_to ? String(row.assigned_to) : null,
    assignedName: row.assigned_name || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = router;
