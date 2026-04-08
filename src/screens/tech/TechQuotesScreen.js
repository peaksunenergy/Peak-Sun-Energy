import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { getAssignedQuotes, updateQuoteStatus } from '../../services/api';
import { CLIENT_TYPES, SERVICE_TYPES, QUOTE_STATES } from '../../constants/config';
import { QuoteStatusBadge } from '../../components/StatusBadge';
import Header from '../../components/Header';
import { useToast } from '../../components/Toast';

export default function TechQuotesScreen({ navigation }) {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const loadQuotes = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getAssignedQuotes(user.id);
      setQuotes(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (_) {}
  }, [user]);

  useFocusEffect(useCallback(() => { loadQuotes(); }, [loadQuotes]));

  async function onRefresh() {
    setRefreshing(true);
    await loadQuotes();
    setRefreshing(false);
  }

  async function handleTreat(quote) {
    try {
      const updated = await updateQuoteStatus(quote.id, 'treated');
      setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      toast('Devis marqué comme traité ✓');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  function renderQuote({ item }) {
    const clientType = CLIENT_TYPES.find((t) => t.value === item.clientType)?.label || item.clientType;
    const serviceType = SERVICE_TYPES.find((t) => t.value === item.serviceType)?.label || item.serviceType;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
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
          <Text style={styles.steg}>STEG : {item.stegAmount} DT | {item.stegPower} kW</Text>
        ) : null}

        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </Text>

        {item.status !== 'treated' && (
          <TouchableOpacity style={styles.treatBtn} onPress={() => handleTreat(item)}>
            <Text style={styles.treatBtnText}>✅ Marquer comme traité</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const pending = quotes.filter((q) => q.status !== 'treated');

  return (
    <View style={styles.container}>
      <Header title={`Mes devis (${pending.length} en cours)`} onBack={() => navigation.goBack()} />
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        renderItem={renderQuote}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun devis assigné</Text>
          </View>
        }
      />
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
  name: { fontSize: 16, fontWeight: '700', color: COLORS.secondary, marginBottom: 4 },
  info: { fontSize: 13, color: COLORS.gray, marginBottom: 2 },
  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 6, flexWrap: 'wrap' },
  tag: {
    backgroundColor: COLORS.primaryLight + '40',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  tagText: { fontSize: 12, color: COLORS.primaryDark, fontWeight: '600' },
  steg: { fontSize: 12, color: COLORS.gray, fontStyle: 'italic', marginTop: 4 },
  date: { fontSize: 11, color: COLORS.grayMedium, marginTop: 8 },
  treatBtn: {
    marginTop: 12,
    backgroundColor: COLORS.success || '#22C55E',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  treatBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: COLORS.grayMedium, fontSize: 14 },
});
