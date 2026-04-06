import { API_URL } from '../constants/apiConfig';

// ============================================================
// Service API — Appels HTTP vers le backend Express + PostgreSQL
// ============================================================

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Erreur serveur');
  }
  return res.json();
}

// ---------- Demandes de devis ----------

export async function submitQuoteRequest(data) {
  return request('/quotes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getQuoteRequests() {
  return request('/quotes');
}

// ---------- Contact ----------

export async function submitContactMessage(data) {
  return request('/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getContactMessages() {
  return request('/contact');
}

// ---------- Clients ----------

export async function getClients() {
  return request('/clients');
}

export async function addClient(clientData) {
  return request('/clients', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
}

export async function updateClient(id, updates) {
  return request(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteClient(id) {
  return request(`/clients/${id}`, { method: 'DELETE' });
}

// ---------- Réclamations ----------

export async function getClaims() {
  return request('/claims');
}

export async function getClientClaims(clientId) {
  return request(`/claims/client/${clientId}`);
}

export async function submitClaim(claimData) {
  return request('/claims', {
    method: 'POST',
    body: JSON.stringify(claimData),
  });
}

export async function updateClaimStatus(claimId, newStatus) {
  return request(`/claims/${claimId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: newStatus }),
  });
}

// ---------- Vérification 48h ----------

export async function checkOverdueClaims() {
  return request('/claims/overdue');
}

// ---------- Notifications ----------

export async function getNotifications() {
  return request('/notifications');
}

export async function addNotification(notifData) {
  return request('/notifications', {
    method: 'POST',
    body: JSON.stringify(notifData),
  });
}

// ---------- Installations (vue client) ----------

export async function getClientInstallation(clientId) {
  return request(`/clients/${clientId}/installation`);
}
