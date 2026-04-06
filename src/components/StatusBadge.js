import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CLAIM_STATES, INSTALLATION_STATES } from '../constants/config';

export function ClaimStatusBadge({ status }) {
  const state = CLAIM_STATES.find((s) => s.value === status) || CLAIM_STATES[0];
  return (
    <View style={[styles.badge, { backgroundColor: state.color + '20' }]}>
      <View style={[styles.dot, { backgroundColor: state.color }]} />
      <Text style={[styles.text, { color: state.color }]}>{state.label}</Text>
    </View>
  );
}

export function InstallationStatusBadge({ status }) {
  const state = INSTALLATION_STATES.find((s) => s.value === status) || INSTALLATION_STATES[0];
  return (
    <View style={[styles.badge, { backgroundColor: state.color + '20' }]}>
      <View style={[styles.dot, { backgroundColor: state.color }]} />
      <Text style={[styles.text, { color: state.color }]}>{state.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
