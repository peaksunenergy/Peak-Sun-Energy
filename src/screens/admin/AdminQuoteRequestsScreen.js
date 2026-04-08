import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../../constants/colors';
import { getQuoteRequests, updateQuoteStatus, assignQuote, getTechnicians, deleteQuote } from '../../services/api';
import { CLIENT_TYPES, SERVICE_TYPES, QUOTE_STATES } from '../../constants/config';
import { QuoteStatusBadge } from '../../components/StatusBadge';
import Header from '../../components/Header';
import { useToast } from '../../components/Toast';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function AdminQuoteRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [modalType, setModalType] = useState(null); // 'status' | 'assign'
  const { user } = useAuth();
  const toast = useToast();

  const loadData = useCallback(async () => {
    const [quotesData, techsData] = await Promise.all([
      getQuoteRequests(),
      getTechnicians().catch(() => []),
    ]);
    setRequests(quotesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    setTechnicians(techsData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleStatusChange(status) {
    if (!selectedQuote) return;
    try {
      const updated = await updateQuoteStatus(selectedQuote.id, status);
      setRequests((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      toast('Statut mis à jour');
    } catch (e) {
      toast(e.message, 'error');
    }
    setModalType(null);
    setSelectedQuote(null);
  }

  async function handleAssign(techId, techName) {
    if (!selectedQuote) return;
    try {
      const updated = await assignQuote(selectedQuote.id, techId, techName);
      setRequests((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      toast(`Assigné à ${techName}`);
    } catch (e) {
      toast(e.message, 'error');
    }
    setModalType(null);
    setSelectedQuote(null);
  }

  async function handleDelete(quoteId) {
    try {
      await deleteQuote(quoteId);
      setRequests((prev) => prev.filter((q) => q.id !== quoteId));
      toast('Devis supprimé');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  function renderRequest({ item }) {
    const clientType = CLIENT_TYPES.find((t) => t.value === item.clientType)?.label || item.clientType;
    const serviceType = SERVICE_TYPES.find((t) => t.value === item.serviceType)?.label || item.serviceType;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.info}>📧 {item.email}</Text>
            <Text style={styles.info}>📞 {item.phone}</Text>
            <Text style={styles.info}>📍 {item.location}</Text>
          </View>
          <QuoteStatusBadge status={item.status} />
        </View>

        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{clientType}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{serviceType}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.power} kW</Text>
          </View>
        </View>

        {item.stegAmount ? (
          <Text style={styles.steg}>
            STEG : {item.stegAmount} DT | {item.stegPower} kW
          </Text>
        ) : null}

        {item.assignedName ? (
          <Text style={styles.assignedText}>👤 Assigné à : {item.assignedName}</Text>
        ) : null}

        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { setSelectedQuote(item); setModalType('status'); }}
          >
            <Text style={styles.actionText}>Changer statut</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={() => { setSelectedQuote(item); setModalType('assign'); }}
          >
            <Text style={[styles.actionText, styles.actionTextSecondary]}>Assigner</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Build assignee list: admin + technicians
  const assigneeList = [
    { id: user.id, name: `${user.firstName} ${user.lastName} (Admin)` },
    ...technicians.map((t) => ({ id: t.id, name: `${t.firstName} ${t.lastName}` })),
  ];

  return (
    <View style={styles.container}>
      <Header title="Demandes de devis" onBack={() => navigation.goBack()} />
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune demande de devis</Text>
          </View>
        }
      />

      {/* Status modal */}
      <Modal visible={modalType === 'status'} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setModalType(null)}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Changer le statut</Text>
            {QUOTE_STATES.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[
                  styles.modalOption,
                  selectedQuote?.status === s.value && { backgroundColor: s.color + '20' },
                ]}
                onPress={() => handleStatusChange(s.value)}
              >
                <View style={[styles.modalDot, { backgroundColor: s.color }]} />
                <Text style={styles.modalOptionText}>{s.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setModalType(null)}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Assign modal */}
      <Modal visible={modalType === 'assign'} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setModalType(null)}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Assigner à</Text>
            {assigneeList.map((a) => {
              const isAlreadyAssigned = String(selectedQuote?.assignedTo) === String(a.id);
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[
                    styles.modalOption,
                    isAlreadyAssigned && { backgroundColor: COLORS.grayLight, opacity: 0.5 },
                  ]}
                  onPress={() => !isAlreadyAssigned && handleAssign(a.id, a.name)}
                  disabled={isAlreadyAssigned}
                >
                  <Text style={styles.modalOptionText}>
                    👤 {a.name}{isAlreadyAssigned ? ' (déjà assigné)' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setModalType(null)}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  info: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: COLORS.primaryLight + '40',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  steg: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: 4,
  },
  assignedText: {
    fontSize: 13,
    color: COLORS.secondaryLight,
    fontWeight: '600',
    marginTop: 6,
  },
  date: {
    fontSize: 11,
    color: COLORS.grayMedium,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  actionTextSecondary: {
    color: COLORS.primary,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
    backgroundColor: COLORS.danger + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: COLORS.grayMedium,
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  modalOptionText: {
    fontSize: 15,
    color: COLORS.black,
  },
  modalCancel: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
});
