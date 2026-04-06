import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../../constants/colors';
import {
  getClaims, updateClaimStatus, assignClaim,
  getTechnicians, getClaimHistory,
} from '../../services/api';
import { ClaimStatusBadge } from '../../components/StatusBadge';
import Header from '../../components/Header';

export default function AdminClaimManagementScreen({ navigation }) {
  const [claims, setClaims] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Assign modal
  const [assignModal, setAssignModal] = useState(false);
  const [assignClaimId, setAssignClaimId] = useState(null);
  const [technicians, setTechnicians] = useState([]);

  // History modal
  const [historyModal, setHistoryModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyClaimId, setHistoryClaimId] = useState(null);

  const loadClaims = useCallback(async () => {
    const data = await getClaims();
    setClaims(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClaims();
    }, [loadClaims])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadClaims();
    setRefreshing(false);
  }

  function handleReopen(claim) {
    const doReopen = async () => {
      try {
        await updateClaimStatus(claim.id, 'in_progress', 'Réouverte par l\'admin');
        if (Platform.OS === 'web') {
          window.alert('Réclamation réouverte');
        } else {
          Alert.alert('Succès', 'Réclamation réouverte');
        }
        loadClaims();
      } catch (e) {
        const msg = e.message || 'Impossible de réouvrir';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Erreur', msg);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Réouvrir cette réclamation ?')) {
        doReopen();
      }
    } else {
      Alert.alert('Réouvrir', 'Réouvrir cette réclamation ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: doReopen },
      ]);
    }
  }

  async function openAssignModal(claimId) {
    const techs = await getTechnicians();
    setTechnicians(techs);
    setAssignClaimId(claimId);
    setAssignModal(true);
  }

  async function handleAssign(tech) {
    await assignClaim(assignClaimId, tech.id, `${tech.firstName} ${tech.lastName}`);
    setAssignModal(false);
    Alert.alert('Assigné', `Réclamation assignée à ${tech.firstName} ${tech.lastName}`);
    loadClaims();
  }

  async function openHistory(claimId) {
    const data = await getClaimHistory(claimId);
    setHistory(data);
    setHistoryClaimId(claimId);
    setHistoryModal(true);
  }

  const filteredClaims = claims.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const filters = [
    { label: 'Toutes', value: 'all' },
    { label: '🔴 Non consultées', value: 'created' },
    { label: '🟠 En traitement', value: 'in_progress' },
    { label: '🟢 Résolues', value: 'resolved' },
  ];

  function renderClaim({ item }) {
    const isTechnical = item.type === 'technical';
    const isOverdue =
      item.status !== 'resolved' &&
      Date.now() - new Date(item.createdAt).getTime() > 48 * 60 * 60 * 1000;

    return (
      <View style={[styles.card, isOverdue && styles.cardOverdue]}>
        {isOverdue && (
          <View style={styles.overdueTag}>
            <Ionicons name="warning" size={14} color={COLORS.danger} />
            <Text style={styles.overdueText}>+48h sans traitement</Text>
          </View>
        )}

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
          <Text style={styles.assignedName}>👤 Assigné à : {item.assignedName}</Text>
        )}
        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>

        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </Text>

        <View style={styles.actionsRow}>
          {item.status !== 'resolved' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.secondaryLight }]}
              onPress={() => openAssignModal(item.id)}
            >
              <Ionicons name="person-add" size={16} color={COLORS.white} />
              <Text style={styles.actionText}>Assigner</Text>
            </TouchableOpacity>
          )}

          {item.status === 'resolved' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.warning || '#e67e22' }]}
              onPress={() => handleReopen(item)}
            >
              <Ionicons name="refresh" size={16} color={COLORS.white} />
              <Text style={styles.actionText}>Réouvrir</Text>
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
      <Header title="Réclamations" onBack={() => navigation.goBack()} />

      <View style={styles.filterRow}>
        {filters.map((f) => (
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
        keyExtractor={(item) => item.id}
        renderItem={renderClaim}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}><Text style={styles.emptyText}>Aucune réclamation</Text></View>
        }
      />

      {/* Assign Modal */}
      <Modal visible={assignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assigner à un technicien</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {technicians.map(tech => (
                <TouchableOpacity
                  key={tech.id}
                  style={styles.techItem}
                  onPress={() => handleAssign(tech)}
                >
                  <Ionicons name="person" size={20} color={COLORS.secondaryLight} />
                  <Text style={styles.techName}>{tech.firstName} {tech.lastName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setAssignModal(false)}>
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
              {history.length === 0 && (
                <Text style={styles.emptyText}>Aucun historique</Text>
              )}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 11,
    color: COLORS.gray,
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  list: { padding: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  cardOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.danger,
  },
  overdueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  overdueText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  clientName: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: COLORS.black,
    lineHeight: 18,
    marginBottom: 8,
  },
  date: {
    fontSize: 11,
    color: COLORS.grayMedium,
    marginBottom: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  assignedName: {
    fontSize: 12,
    color: COLORS.secondaryLight,
    fontWeight: '600',
    marginBottom: 6,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: COLORS.grayMedium,
    fontSize: 14,
  },
  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, maxHeight: '70%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.secondary, marginBottom: 16 },
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
