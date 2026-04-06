const express = require('express');
const supabase = require('../db/pool');

const router = express.Router();

// GET /api/users/technicians — list all technicians
router.get('/technicians', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, login, first_name, last_name, role')
      .eq('role', 'technician')
      .order('first_name');

    if (error) throw error;

    res.json(data.map(u => ({
      id: String(u.id),
      login: u.login,
      firstName: u.first_name,
      lastName: u.last_name,
      role: u.role,
    })));
  } catch (err) {
    console.error('Get technicians error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/users/technicians/stats — tech stats with resolved tickets
router.get('/technicians/stats', async (_req, res) => {
  try {
    // Get all technicians
    const { data: techs, error: techError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('role', 'technician');

    if (techError) throw techError;

    // Get all claims with assignment
    const { data: claims, error: claimError } = await supabase
      .from('claims')
      .select('id, status, assigned_to');

    if (claimError) throw claimError;

    // Get all history actions by technicians
    const { data: history, error: histError } = await supabase
      .from('claim_history')
      .select('claim_id, performed_by, action, to_value');

    if (histError) throw histError;

    const stats = techs.map(tech => {
      // Currently assigned to this tech
      const assigned = claims.filter(c => c.assigned_to === tech.id);
      const currentInProgress = assigned.filter(c => c.status === 'in_progress' || c.status === 'created');

      // Resolved by this tech (from history: status_change to 'resolved' performed by this tech)
      const resolvedByTech = history.filter(h =>
        h.performed_by === tech.id &&
        h.action === 'status_change' &&
        h.to_value === 'resolved'
      );

      // Interventions = number of tickets resolved by this tech
      const totalInterventions = resolvedByTech.length;

      return {
        id: String(tech.id),
        firstName: tech.first_name,
        lastName: tech.last_name,
        totalAssigned: assigned.length,
        resolved: resolvedByTech.length,
        inProgress: currentInProgress.length,
        totalInterventions: totalInterventions,
      };
    });

    res.json(stats);
  } catch (err) {
    console.error('Get tech stats error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
