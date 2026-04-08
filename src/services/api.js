import { API_URL } from '../constants/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// Service API — Appels HTTP vers le backend Express + Supabase
// ============================================================

async function getToken() {
  try {
    const stored = await AsyncStorage.getItem('currentUser');
    if (stored) {
      const user = JSON.parse(stored);
      return user.token;
    }
  } catch (_) {}
  return null;
}

async function request(path, options = {}) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Erreur serveur');
  }
  return res.json();
}

// ---------- Demandes de devis ----------

export async function registerUser(data) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function forgotPassword(email) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

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

export async function updateClaimStatus(claimId, newStatus, note) {
  return request(`/claims/${claimId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: newStatus, note }),
  });
}

// ---------- Assignation / Transfert ----------

export async function assignClaim(claimId, technicianId, technicianName, note) {
  return request(`/claims/${claimId}/assign`, {
    method: 'PUT',
    body: JSON.stringify({ technicianId, technicianName, note }),
  });
}

export async function forwardClaim(claimId, technicianId, technicianName, reason) {
  return request(`/claims/${claimId}/forward`, {
    method: 'PUT',
    body: JSON.stringify({ technicianId, technicianName, reason }),
  });
}

export async function getAssignedClaims(techId) {
  return request(`/claims/assigned/${techId}`);
}

export async function getClaimHistory(claimId) {
  return request(`/claims/${claimId}/history`);
}

// ---------- Techniciens ----------

export async function getTechnicians() {
  return request('/users/technicians');
}

export async function getTechnicianStats() {
  return request('/users/technicians/stats');
}

// ---------- Vérification 48h ----------

export async function checkOverdueClaims() {
  return request('/claims/overdue');
}

// ---------- Installations (vue client) ----------

export async function getClientInstallation(clientId) {
  return request(`/clients/${clientId}/installation`);
}
