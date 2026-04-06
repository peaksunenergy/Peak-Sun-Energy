import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../../constants/colors';
import { getClaims, updateClaimStatus } from '../../services/api';
import { ClaimStatusBadge } from '../../components/StatusBadge';
import Header from '../../components/Header';

export default function AdminClaimManagementScreen({ navigation }) {
  const [claims, setClaims] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

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

  function handleStatusChange(claim) {
    const nextStates = {
      created: { label: 'Marquer En traitement', value: 'in_progress' },
      in_progress: { label: 'Marquer Résolue', value: 'resolved' },
    };

    const next = nextStates[claim.status];
    if (!next) return;

    Alert.alert('Changer l\'état', `${next.label} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          await updateClaimStatus(claim.id, next.value);
          loadClaims();
        },
      },
    ]);
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
      item.status === 'created' &&
      isTechnical &&
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
        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>

        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        {item.status !== 'resolved' && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleStatusChange(item)}
          >
            <Ionicons name="arrow-forward-circle" size={18} color={COLORS.white} />
            <Text style={styles.actionText}>
              {item.status === 'created' ? 'Prendre en charge' : 'Marquer résolue'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Réclamations" onBack={() => navigation.goBack()} />

      {/* Filtres */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterBtn, filter === f.value && styles.filterBtnActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.value && styles.filterTextActive,
              ]}
            >
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
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune réclamation</Text>
          </View>
        }
      />
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
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: COLORS.grayMedium,
    fontSize: 14,
  },
});
