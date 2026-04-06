import React, { useState, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { getClientClaims } from '../../services/api';
import ClaimCard from '../../components/ClaimCard';
import Header from '../../components/Header';

export default function ClientClaimsScreen({ navigation }) {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadClaims = useCallback(async () => {
    if (!user) return;
    const data = await getClientClaims(user.id);
    setClaims(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, [user]);

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

  return (
    <View style={styles.container}>
      <Header title="Mes réclamations" onBack={() => navigation.goBack()} />
      <FlatList
        data={claims}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => <ClaimCard claim={item} />}
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
  list: { padding: 20 },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: COLORS.grayMedium,
    fontSize: 14,
  },
});
