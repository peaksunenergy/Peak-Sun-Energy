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
import { getClientInstallation, getClientClaims } from '../../services/api';
import { InstallationStatusBadge } from '../../components/StatusBadge';

export default function ClientDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [installation, setInstallation] = useState(null);
  const [claims, setClaims] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const inst = await getClientInstallation(user.id);
      setInstallation(inst);
      const cl = await getClientClaims(user.id);
      setClaims(cl);
    } catch (e) {
      // ignore
    }
  }, [user]);

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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Bonjour,</Text>
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Suivi installation */}
        <Text style={styles.sectionTitle}>Mon installation</Text>
        {installation ? (
          <View style={styles.installCard}>
            <View style={styles.installRow}>
              <Text style={styles.installLabel}>Localisation</Text>
              <Text style={styles.installValue}>{installation.location}</Text>
            </View>
            <View style={styles.installRow}>
              <Text style={styles.installLabel}>Usage</Text>
              <Text style={styles.installValue}>{installation.usage}</Text>
            </View>
            <View style={styles.installRow}>
              <Text style={styles.installLabel}>Puissance</Text>
              <Text style={styles.installValue}>{installation.power}</Text>
            </View>
            <View style={styles.installRow}>
              <Text style={styles.installLabel}>Caractéristiques</Text>
              <Text style={styles.installValue}>
                {installation.characteristics}
              </Text>
            </View>
            <View style={styles.installRow}>
              <Text style={styles.installLabel}>État</Text>
              <InstallationStatusBadge status={installation.state} />
            </View>
            {installation.remark ? (
              <View style={styles.installRow}>
                <Text style={styles.installLabel}>Remarque</Text>
                <Text style={styles.installValue}>{installation.remark}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="sunny-outline" size={40} color={COLORS.grayMedium} />
            <Text style={styles.emptyText}>Aucune installation enregistrée</Text>
          </View>
        )}

        {/* Réclamations */}
        <View style={styles.claimsHeader}>
          <Text style={styles.sectionTitle}>Mes réclamations</Text>
          <Text style={styles.claimCount}>{claims.length}</Text>
        </View>

        <TouchableOpacity
          style={styles.newClaimBtn}
          onPress={() => navigation.navigate('ClientNewClaim')}
        >
          <Ionicons name="add-circle" size={20} color={COLORS.white} />
          <Text style={styles.newClaimText}>Nouvelle réclamation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewClaimsBtn}
          onPress={() => navigation.navigate('ClientClaims')}
        >
          <Ionicons name="list" size={20} color={COLORS.primary} />
          <Text style={styles.viewClaimsText}>Voir mes réclamations</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: { color: COLORS.white, fontSize: 14, opacity: 0.9 },
  name: { color: COLORS.white, fontSize: 22, fontWeight: '700' },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 12,
  },
  installCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    ...SHADOWS.medium,
  },
  installRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  installLabel: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
    flex: 1,
  },
  installValue: {
    fontSize: 13,
    color: COLORS.black,
    fontWeight: '600',
    flex: 1.2,
    textAlign: 'right',
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  emptyText: {
    color: COLORS.grayMedium,
    marginTop: 8,
    fontSize: 13,
  },
  claimsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  claimCount: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  newClaimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 10,
  },
  newClaimText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  viewClaimsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  viewClaimsText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});
