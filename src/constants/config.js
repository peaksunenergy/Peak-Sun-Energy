export const CLIENT_TYPES = [
  { label: 'Résidentiel', value: 'residential' },
  { label: 'Industriel', value: 'industrial' },
  { label: 'Agricole', value: 'agricultural' },
];

export const SERVICE_TYPES = [
  { label: 'Étude et devis', value: 'study' },
  { label: 'Installation', value: 'installation' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Accompagnement administratif', value: 'admin_support' },
];

export const INSTALLATION_STATES = [
  { label: 'En attente', value: 'pending', color: '#F59E0B' },
  { label: 'Déposé', value: 'submitted', color: '#3B82F6' },
  { label: 'En cours', value: 'in_progress', color: '#F97316' },
  { label: 'Réceptionné', value: 'completed', color: '#22C55E' },
];

export const CLAIM_STATES = [
  { label: 'Non consultée', value: 'created', color: '#EF4444' },
  { label: 'En traitement', value: 'in_progress', color: '#F97316' },
  { label: 'Résolue', value: 'resolved', color: '#22C55E' },
];

export const CLAIM_TYPES = [
  { label: 'Technique', value: 'technical' },
  { label: 'Administrative', value: 'administrative' },
];

export const QUOTE_STATES = [
  { label: 'En attente', value: 'pending', color: '#F59E0B' },
  { label: 'En cours', value: 'in_progress', color: '#3B82F6' },
  { label: 'Devis envoyé', value: 'sent', color: '#8B5CF6' },
  { label: 'Accepté', value: 'accepted', color: '#22C55E' },
  { label: 'Refusé', value: 'rejected', color: '#EF4444' },
];
