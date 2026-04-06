import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../../constants/colors';
import { getClients, deleteClient } from '../../services/api';
import { InstallationStatusBadge } from '../../components/StatusBadge';
import Header from '../../components/Header';
import { useToast } from '../../components/Toast';

export default function AdminClientManagementScreen({ navigation }) {
  const [clients, setClients] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const loadClients = useCallback(async () => {
    const data = await getClients();
    setClients(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [loadClients])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  }

  function handleDelete(client) {
    const doDelete = async () => {
      try {
        await deleteClient(client.id);
        setClients(prev => prev.filter(c => c.id !== client.id));
        toast('Client supprimé avec succès');
      } catch (e) {
        toast(e.message || 'Impossible de supprimer le client', 'error');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Voulez-vous vraiment supprimer ${client.firstName} ${client.lastName} ?\nCela supprimera aussi ses réclamations.`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Supprimer le client',
        `Voulez-vous vraiment supprimer ${client.firstName} ${client.lastName} ?\nCela supprimera aussi ses réclamations.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  }

  function renderClient({ item }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.clientName}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.clientInfo}>📍 {item.location}</Text>
            <Text style={styles.clientInfo}>📞 {item.phone}</Text>
          </View>
          <InstallationStatusBadge status={item.state} />
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Usage</Text>
            <Text style={styles.detailValue}>{item.usage}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Puissance</Text>
            <Text style={styles.detailValue}>{item.power}</Text>
          </View>
        </View>

        {item.characteristics ? (
          <Text style={styles.characteristics}>{item.characteristics}</Text>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('AdminEditClient', { client: item })}
          >
            <Ionicons name="create" size={16} color={COLORS.secondaryLight} />
            <Text style={styles.editText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash" size={16} color={COLORS.danger} />
            <Text style={styles.deleteText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Gestion des clients"
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'add-circle',
          onPress: () => navigation.navigate('AdminAddClient'),
        }}
      />
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={renderClient}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={COLORS.grayMedium} />
            <Text style={styles.emptyText}>Aucun client enregistré</Text>
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
    marginBottom: 14,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  clientInfo: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    backgroundColor: COLORS.grayLight,
    borderRadius: 8,
    padding: 10,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.gray,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 2,
  },
  characteristics: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: 10,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    fontSize: 13,
    color: COLORS.secondaryLight,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteText: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: COLORS.grayMedium,
    fontSize: 14,
    marginTop: 8,
  },
});
