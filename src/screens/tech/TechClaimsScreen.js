import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput,
  StyleSheet, RefreshControl, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import {
  getAssignedClaims, getClaims, updateClaimStatus, forwardClaim,
  getTechnicians, getClaimHistory,
} from '../../services/api';
import { ClaimStatusBadge } from '../../components/StatusBadge';
import Header from '../../components/Header';

export default function TechClaimsScreen({ navigation }) {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('mine'); // 'mine' or 'all'

  // Forward modal
  const [forwardModal, setForwardModal] = useState(false);
  const [forwardClaimId, setForwardClaimId] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [forwardReason, setForwardReason] = useState('');

  // History modal
  const [historyModal, setHistoryModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyClaimId, setHistoryClaimId] = useState(null);

  const loadClaims = useCallback(async () => {
    if (!user) return;
    const data = viewMode === 'mine'
      ? await getAssignedClaims(user.id)
      : await getClaims();
    setClaims(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, [user, viewMode]);

  useFocusEffect(useCallback(() => { loadClaims(); }, [loadClaims]));

  async function onRefresh() {
    setRefreshing(true);
    await loadClaims();
    setRefreshing(false);
  }

  function handleStatusChange(claim) {
    const nextStates = {
      created: { label: 'Marquer En traitement', value: 'in_progress' },
      in_progress: { label: 'Marquer Résolue', value: 'resolved' },
      resolved: { label: 'Réouvrir', value: 'in_progress' },
    };
    const next = nextStates[claim.status];
    if (!next) return;

    Alert.alert('Changer le statut', `${next.label} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          try {
            const note = claim.status === 'resolved' ? 'Réouverte par le technicien' : undefined;
            await updateClaimStatus(claim.id, next.value, note);
            Alert.alert('Succès', next.label + ' ✓');
            loadClaims();
          } catch (e) {
            Alert.alert('Erreur', e.message || 'Impossible de changer le statut');
          }
        },
      },
    ]);
  }

  async function openForwardModal(claimId) {
    const techs = await getTechnicians();
    setTechnicians(techs.filter(t => t.id !== user.id));
    setForwardClaimId(claimId);
    setForwardReason('');
    setForwardModal(true);
  }

  async function handleForward(tech) {
    await forwardClaim(forwardClaimId, tech.id, `${tech.firstName} ${tech.lastName}`, forwardReason);
    setForwardModal(false);
    Alert.alert('Transféré', `Réclamation transférée à ${tech.firstName} ${tech.lastName}`);
    loadClaims();
  }

  async function openHistory(claimId) {
    const data = await getClaimHistory(claimId);
    setHistory(data);
    setHistoryClaimId(claimId);
    setHistoryModal(true);
  }

  const filteredClaims = claims.filter(c => filter === 'all' || c.status === filter);

  const filters = [
    { label: 'Toutes', value: 'all' },
    { label: '🔴 Nouvelles', value: 'created' },
    { label: '🟠 En cours', value: 'in_progress' },
    { label: '🟢 Résolues', value: 'resolved' },
  ];

  function renderClaim({ item }) {
    const isTechnical = item.type === 'technical';
    const isMine = item.assignedTo === user.id;
    return (
      <View style={[styles.card, !isMine && viewMode === 'all' && styles.cardReadonly]}>
        <View style={styles.cardHeader}>
          <View style={styles.typeRow}>
            <Ionicons
              name={isTechnical ? 'construct' : 'document-text'}
              size={18}
              color={isTechnical ? COLORS.secondaryLight : COLORS.primary}
            />
            <Text style={styles.typeName}>
              {isTechnical ? 'Technique' : 'Administrative'}
            </Text>
          </View>
          <ClaimStatusBadge status={item.status} />
        </View>

        <Text style={styles.clientName}>Client : {item.clientName}</Text>
        {item.assignedName && (
          <Text style={styles.assignedLabel}>👤 Assigné à : {item.assignedName}</Text>
        )}
        <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </Text>

        <View style={styles.actions}>
          {isMine && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: item.status === 'resolved' ? (COLORS.warning || '#e67e22') : COLORS.primary }]}
              onPress={() => handleStatusChange(item)}
            >
              <Ionicons name={item.status === 'resolved' ? 'refresh' : 'arrow-forward-circle'} size={16} color={COLORS.white} />
              <Text style={styles.actionText}>
                {item.status === 'created' ? 'Prendre en charge' : item.status === 'in_progress' ? 'Résoudre' : 'Réouvrir'}
              </Text>
            </TouchableOpacity>
          )}

          {isMine && item.status !== 'resolved' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.secondaryLight }]}
              onPress={() => openForwardModal(item.id)}
            >
              <Ionicons name="swap-horizontal" size={16} color={COLORS.white} />
              <Text style={styles.actionText}>Transférer</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.gray }]}
            onPress={() => openHistory(item.id)}
          >
            <Ionicons name="time" size={16} color={COLORS.white} />
            <Text style={styles.actionText}>Historique</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={viewMode === 'mine' ? 'Mes réclamations' : 'Toutes les réclamations'} onBack={() => navigation.goBack()} />

      {/* View mode toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'mine' && styles.toggleBtnActive]}
          onPress={() => setViewMode('mine')}
        >
          <Text style={[styles.toggleText, viewMode === 'mine' && styles.toggleTextActive]}>Mes tickets</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'all' && styles.toggleBtnActive]}
          onPress={() => setViewMode('all')}
        >
          <Text style={[styles.toggleText, viewMode === 'all' && styles.toggleTextActive]}>Tous les tickets</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterBtn, filter === f.value && styles.filterBtnActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredClaims}
        keyExtractor={item => item.id}
        renderItem={renderClaim}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}><Text style={styles.emptyText}>Aucune réclamation assignée</Text></View>
        }
      />

      {/* Forward Modal */}
      <Modal visible={forwardModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Transférer à un technicien</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Raison du transfert (optionnel)"
              value={forwardReason}
              onChangeText={setForwardReason}
            />
            <ScrollView style={{ maxHeight: 250 }}>
              {technicians.map(tech => (
                <TouchableOpacity
                  key={tech.id}
                  style={styles.techItem}
                  onPress={() => handleForward(tech)}
                >
                  <Ionicons name="person" size={20} color={COLORS.secondaryLight} />
                  <Text style={styles.techName}>{tech.firstName} {tech.lastName}</Text>
                </TouchableOpacity>
              ))}
              {technicians.length === 0 && (
                <Text style={styles.emptyText}>Aucun autre technicien disponible</Text>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setForwardModal(false)}>
              <Text style={styles.modalCloseText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={historyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Historique — Réclamation #{historyClaimId}</Text>
            <ScrollView style={{ maxHeight: 350 }}>
              {history.map(h => (
                <View key={h.id} style={styles.historyItem}>
                  <View style={styles.historyDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyAction}>
                      {h.action === 'created' && '📝 Créée'}
                      {h.action === 'status_change' && `🔄 ${h.fromValue} → ${h.toValue}`}
                      {h.action === 'assigned' && `👤 Assignée à ${h.toValue}`}
                      {h.action === 'forwarded' && `🔀 Transférée: ${h.fromValue} → ${h.toValue}`}
                      {h.action === 'escalated' && '⚠️ Escaladée (48h)'}
                    </Text>
                    <Text style={styles.historyMeta}>
                      par {h.performerName} — {new Date(h.createdAt).toLocaleString('fr-FR')}
                    </Text>
                    {h.note ? <Text style={styles.historyNote}>{h.note}</Text> : null}
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setHistoryModal(false)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  toggleRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, gap: 8,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.grayMedium,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary,
  },
  toggleText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  toggleTextActive: { color: COLORS.white },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  filterBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.grayMedium,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 11, color: COLORS.gray },
  filterTextActive: { color: COLORS.white, fontWeight: '600' },
  list: { padding: 16 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16,
    marginBottom: 12, ...SHADOWS.small,
  },
  cardReadonly: {
    opacity: 0.85, borderLeftWidth: 3, borderLeftColor: COLORS.grayMedium,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeName: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  clientName: { fontSize: 13, color: COLORS.gray, fontWeight: '500', marginBottom: 4 },
  assignedLabel: { fontSize: 12, color: COLORS.secondaryLight, fontWeight: '600', marginBottom: 6 },
  description: { fontSize: 13, color: COLORS.black, lineHeight: 18, marginBottom: 8 },
  date: { fontSize: 11, color: COLORS.grayMedium, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12,
  },
  actionText: { color: COLORS.white, fontWeight: '600', fontSize: 12 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: COLORS.grayMedium, fontSize: 14 },
  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, maxHeight: '70%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.secondary, marginBottom: 16 },
  modalInput: {
    borderWidth: 1, borderColor: COLORS.grayMedium, borderRadius: 10,
    padding: 12, marginBottom: 16, fontSize: 14,
  },
  techItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight,
  },
  techName: { fontSize: 15, fontWeight: '500', color: COLORS.secondary },
  modalClose: {
    alignItems: 'center', paddingVertical: 14, marginTop: 12,
    borderRadius: 10, backgroundColor: COLORS.grayLight,
  },
  modalCloseText: { fontSize: 15, fontWeight: '600', color: COLORS.gray },
  // History
  historyItem: {
    flexDirection: 'row', gap: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.grayLight,
  },
  historyDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.primary, marginTop: 5,
  },
  historyAction: { fontSize: 13, fontWeight: '600', color: COLORS.secondary },
  historyMeta: { fontSize: 11, color: COLORS.grayMedium, marginTop: 2 },
  historyNote: { fontSize: 12, color: COLORS.gray, fontStyle: 'italic', marginTop: 4 },
});
