import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../../constants/colors';
import { getQuoteRequests } from '../../services/api';
import { CLIENT_TYPES, SERVICE_TYPES } from '../../constants/config';
import Header from '../../components/Header';

export default function AdminQuoteRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    const data = await getQuoteRequests();
    setRequests(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }

  function renderRequest({ item }) {
    const clientType = CLIENT_TYPES.find((t) => t.value === item.clientType)?.label || item.clientType;
    const serviceType = SERVICE_TYPES.find((t) => t.value === item.serviceType)?.label || item.serviceType;

    return (
      <View style={styles.card}>
        <Text style={styles.name}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.info}>📞 {item.phone}</Text>
        <Text style={styles.info}>📍 {item.location}</Text>
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
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>
    );
  }

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
  date: {
    fontSize: 11,
    color: COLORS.grayMedium,
    marginTop: 8,
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
