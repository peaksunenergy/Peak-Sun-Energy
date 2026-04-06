import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { getClients, getClaims, getQuoteRequests, checkOverdueClaims } from '../../services/api';

export default function AdminDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    clients: 0,
    claims: 0,
    pendingClaims: 0,
    quoteRequests: 0,
    overdueClaims: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [clients, claims, quotes, overdue] = await Promise.all([
        getClients(),
        getClaims(),
        getQuoteRequests(),
        checkOverdueClaims(),
      ]);
      const unresolvedClaims = claims.filter((c) => c.status !== 'resolved');
      setStats({
        clients: clients.length,
        claims: claims.length,
        pendingClaims: unresolvedClaims.length,
        quoteRequests: quotes.length,
        overdueClaims: overdue.length,
        unresolvedList: unresolvedClaims.slice(0, 5),
      });
    } catch (e) {
      // ignore
    }
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

  const menuItems = [
    {
      icon: 'people',
      title: 'Gestion des clients',
      subtitle: `${stats.clients} client(s)`,
      color: COLORS.secondaryLight,
      screen: 'AdminClients',
    },
    {
      icon: 'alert-circle',
      title: 'Réclamations',
      subtitle: `${stats.pendingClaims} non résolue(s)`,
      color: COLORS.danger,
      screen: 'AdminClaims',
    },
    {
      icon: 'document-text',
      title: 'Demandes de devis',
      subtitle: `${stats.quoteRequests} demande(s)`,
      color: COLORS.primary,
      screen: 'AdminQuotes',
    },
    {
      icon: 'stats-chart',
      title: 'Stats techniciens',
      subtitle: 'Performance et tickets résolus',
      color: COLORS.success,
      screen: 'AdminTechStats',
    },
  ];

  const { unresolvedList = [] } = stats;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Administration</Text>
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Alerte 48h */}
        {stats.overdueClaims > 0 && (
          <View style={styles.alert}>
            <Ionicons name="warning" size={20} color={COLORS.danger} />
            <Text style={styles.alertText}>
              ⚠️ {stats.overdueClaims} réclamation(s) non traitée(s) depuis +48h
            </Text>
          </View>
        )}

        {/* Stats rapides */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[styles.statNumber, { color: COLORS.secondaryLight }]}>
              {stats.clients}
            </Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF2F2' }]}>
            <Text style={[styles.statNumber, { color: COLORS.danger }]}>
              {stats.pendingClaims}
            </Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
            <Text style={[styles.statNumber, { color: COLORS.primary }]}>
              {stats.quoteRequests}
            </Text>
            <Text style={styles.statLabel}>Devis</Text>
          </View>
        </View>

        {/* Réclamations non résolues */}
        {unresolvedList.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.menuTitle, { marginBottom: 10, fontSize: 16 }]}>Réclamations non résolues</Text>
            {unresolvedList.map((claim) => (
              <TouchableOpacity
                key={claim.id}
                style={[styles.menuItem, { borderLeftWidth: 3, borderLeftColor: claim.status === 'created' ? COLORS.danger : COLORS.primary }]}
                onPress={() => navigation.navigate('AdminClaims')}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>#{claim.id} — {claim.clientName}</Text>
                  <Text style={styles.menuSubtitle} numberOfLines={1}>{claim.description}</Text>
                  <Text style={{ fontSize: 11, color: claim.status === 'created' ? COLORS.danger : COLORS.primary, fontWeight: '600', marginTop: 4 }}>
                    {claim.status === 'created' ? '🔴 Non consultée' : '🟠 En traitement'}
                    {claim.assignedName ? ` — ${claim.assignedName}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Menu */}
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grayMedium} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.secondary,
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: { color: COLORS.white, fontSize: 14, opacity: 0.8 },
  name: { color: COLORS.white, fontSize: 22, fontWeight: '700' },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { padding: 20 },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.danger,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  menuSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
});
