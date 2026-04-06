import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/colors';
import { ClaimStatusBadge } from './StatusBadge';

export default function ClaimCard({ claim, onPress }) {
  const isTechnical = claim.type === 'technical';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Ionicons
            name={isTechnical ? 'construct' : 'document-text'}
            size={20}
            color={isTechnical ? COLORS.secondaryLight : COLORS.primary}
          />
          <Text style={styles.type}>
            {isTechnical ? 'Technique' : 'Administrative'}
          </Text>
        </View>
        <ClaimStatusBadge status={claim.status} />
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {claim.description}
      </Text>
      <Text style={styles.date}>
        {new Date(claim.createdAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  type: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  description: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 8,
    lineHeight: 18,
  },
  date: {
    fontSize: 11,
    color: COLORS.grayMedium,
  },
});
