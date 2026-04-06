import React, { useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { getAssignedClaims } from '../../services/api';

export default function TechDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [claims, setClaims] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getAssignedClaims(user.id);
      setClaims(data);
    } catch (_) {}
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const pending = claims.filter(c => c.status === 'created' || c.status === 'in_progress');
  const resolved = claims.filter(c => c.status === 'resolved');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Technicien</Text>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#FEF2F2' }]}>
            <Text style={[styles.statNumber, { color: COLORS.danger }]}>{pending.length}</Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
            <Text style={[styles.statNumber, { color: COLORS.success }]}>{resolved.length}</Text>
            <Text style={styles.statLabel}>Résolues</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[styles.statNumber, { color: COLORS.secondaryLight }]}>{claims.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('TechClaims')}
        >
          <View style={[styles.menuIcon, { backgroundColor: COLORS.danger + '15' }]}>
            <Ionicons name="construct" size={24} color={COLORS.danger} />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Mes réclamations</Text>
            <Text style={styles.menuSubtitle}>{pending.length} en attente de traitement</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.grayMedium} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: '#047857',
    paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  welcome: { color: COLORS.white, fontSize: 14, opacity: 0.8 },
  name: { color: COLORS.white, fontSize: 22, fontWeight: '700' },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  content: { padding: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, borderRadius: 12, padding: 16, alignItems: 'center', ...SHADOWS.small,
  },
  statNumber: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.gray, marginTop: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16,
    marginBottom: 12, ...SHADOWS.small,
  },
  menuIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  menuText: { flex: 1, marginLeft: 12 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: COLORS.secondary },
  menuSubtitle: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
});
