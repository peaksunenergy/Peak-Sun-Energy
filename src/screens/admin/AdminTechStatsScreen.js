import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../../constants/colors';
import { getTechnicianStats } from '../../services/api';
import Header from '../../components/Header';

export default function AdminTechStatsScreen({ navigation }) {
  const [stats, setStats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    const data = await getTechnicianStats();
    setStats(data);
  }, []);

  useFocusEffect(useCallback(() => { loadStats(); }, [loadStats]));

  async function onRefresh() {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }

  function renderStat({ item }) {
    const rate = item.totalAssigned > 0
      ? Math.round((item.resolved / item.totalAssigned) * 100)
      : 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-circle" size={36} color={COLORS.secondaryLight} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
            <Text style={styles.subtitle}>{item.totalInterventions} intervention(s)</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: COLORS.secondaryLight }]}>{item.totalAssigned}</Text>
            <Text style={styles.statLabel}>Assignées</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: COLORS.primary }]}>{item.inProgress}</Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: COLORS.success }]}>{item.resolved}</Text>
            <Text style={styles.statLabel}>Résolues</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: rate >= 70 ? COLORS.success : COLORS.danger }]}>
              {rate}%
            </Text>
            <Text style={styles.statLabel}>Taux</Text>
          </View>
        </View>

        {/* Simple progress bar */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${rate}%` }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Stats techniciens" onBack={() => navigation.goBack()} />
      <FlatList
        data={stats}
        keyExtractor={item => item.id}
        renderItem={renderStat}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}><Text style={styles.emptyText}>Aucun technicien</Text></View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16,
    marginBottom: 12, ...SHADOWS.small,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
  subtitle: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: COLORS.gray, marginTop: 2 },
  progressBg: {
    height: 6, backgroundColor: COLORS.grayLight, borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: 6, backgroundColor: COLORS.success, borderRadius: 3,
  },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: COLORS.grayMedium, fontSize: 14 },
});
