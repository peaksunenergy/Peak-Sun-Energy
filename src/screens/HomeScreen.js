import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/colors';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroOverlay}>
          <Ionicons name="sunny" size={60} color={COLORS.white} />
          <Text style={styles.heroTitle}>Peak Sun Energy</Text>
          <Text style={styles.heroSubtitle}>
            Solutions photovoltaïques pour un avenir durable
          </Text>
        </View>
      </View>

      {/* À propos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Qui sommes-nous ?</Text>
        <Text style={styles.sectionText}>
          Peak Sun Energy est une entreprise spécialisée dans l'installation de
          systèmes photovoltaïques pour les secteurs résidentiel, industriel et
          agricole. Nous vous accompagnons de l'étude à la maintenance.
        </Text>
      </View>

      {/* Services rapides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nos Services</Text>
        <View style={styles.servicesGrid}>
          {[
            { icon: 'document-text', label: 'Étude & Devis' },
            { icon: 'build', label: 'Installation' },
            { icon: 'settings', label: 'Maintenance' },
            { icon: 'shield-checkmark', label: 'Accompagnement' },
          ].map((service, i) => (
            <TouchableOpacity
              key={i}
              style={styles.serviceItem}
              onPress={() => navigation.navigate('Services')}
            >
              <View style={styles.serviceIcon}>
                <Ionicons name={service.icon} size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.serviceLabel}>{service.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Boutons d'action */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('QuoteRequest')}
        >
          <Ionicons name="calculator" size={20} color={COLORS.white} />
          <Text style={styles.ctaText}>Demander un devis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctaButton, styles.ctaSecondary]}
          onPress={() => navigation.navigate('Contact')}
        >
          <Ionicons name="mail" size={20} color={COLORS.primary} />
          <Text style={[styles.ctaText, styles.ctaTextSecondary]}>
            Nous contacter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctaButton, styles.ctaLogin]}
          onPress={() => navigation.navigate('Login')}
        >
          <Ionicons name="log-in" size={20} color={COLORS.white} />
          <Text style={styles.ctaText}>Espace Client</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  hero: {
    height: 280,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    alignItems: 'center',
    paddingTop: 40,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 22,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceItem: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
    textAlign: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  ctaSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ctaLogin: {
    backgroundColor: COLORS.secondary,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  ctaTextSecondary: {
    color: COLORS.primary,
  },
});
