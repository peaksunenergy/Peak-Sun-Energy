import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import ServiceCard from '../components/ServiceCard';
import Header from '../components/Header';

const DOMAINS = [
  {
    icon: 'home',
    title: 'Installations résidentielles',
    description: 'Solutions solaires adaptées aux maisons et villas.',
  },
  {
    icon: 'business',
    title: 'Installations industrielles',
    description: 'Systèmes photovoltaïques haute capacité pour les usines.',
  },
  {
    icon: 'leaf',
    title: 'Installations agricoles',
    description: 'Énergie solaire pour les exploitations agricoles.',
  },
];

const SERVICES = [
  {
    icon: 'document-text',
    title: 'Étude et devis',
    description:
      'Analyse personnalisée de vos besoins et estimation détaillée des coûts.',
  },
  {
    icon: 'build',
    title: 'Installation',
    description:
      'Mise en place professionnelle de vos panneaux et équipements solaires.',
  },
  {
    icon: 'settings',
    title: 'Maintenance',
    description:
      'Suivi régulier et entretien pour garantir des performances optimales.',
  },
  {
    icon: 'shield-checkmark',
    title: 'Accompagnement administratif',
    description:
      'Aide aux démarches administratives et raccordement STEG.',
  },
];

export default function ServicesScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Header title="Nos Services" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Domaines d'intervention</Text>
        {DOMAINS.map((d, i) => (
          <ServiceCard key={i} {...d} />
        ))}

        <Text style={styles.sectionTitle}>Nos prestations</Text>
        {SERVICES.map((s, i) => (
          <ServiceCard key={i} {...s} />
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, padding: 20 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 16,
    marginTop: 8,
  },
});
