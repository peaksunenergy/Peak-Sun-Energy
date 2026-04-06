import React, { useState } from 'react';
import { ScrollView, View, Text, Alert, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { validateContactForm } from '../utils/validators';
import { submitContactMessage } from '../services/api';
import { FormInput, FormButton } from '../components/FormElements';
import Header from '../components/Header';

export default function ContactScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  async function handleSubmit() {
    const validation = validateContactForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      await submitContactMessage(form);
      Alert.alert(
        'Message envoyé ✓',
        'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'envoyer le message.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Header title="Nous contacter" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Une question ? N'hésitez pas à nous écrire.
        </Text>

        <FormInput
          label="Nom complet"
          placeholder="Votre nom"
          value={form.name}
          onChangeText={(v) => updateField('name', v)}
          error={errors.name}
        />
        <FormInput
          label="Email"
          placeholder="votre@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(v) => updateField('email', v)}
          error={errors.email}
        />
        <FormInput
          label="Téléphone (optionnel)"
          placeholder="Ex: 55123456"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(v) => updateField('phone', v)}
          maxLength={8}
        />
        <FormInput
          label="Message"
          placeholder="Décrivez votre demande..."
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={form.message}
          onChangeText={(v) => updateField('message', v)}
          error={errors.message}
        />

        <FormButton
          title={loading ? 'Envoi en cours...' : 'Envoyer'}
          onPress={handleSubmit}
          disabled={loading}
        />

        {/* Coordonnées */}
        <View style={styles.info}>
          <Text style={styles.infoTitle}>Nos coordonnées</Text>
          <Text style={styles.infoLine}>📍 Tunisie</Text>
          <Text style={styles.infoLine}>📞 +216 XX XXX XXX</Text>
          <Text style={styles.infoLine}>✉️ contact@peaksunenergy.tn</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, padding: 20 },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 20,
  },
  info: {
    marginTop: 30,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 10,
  },
  infoLine: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 6,
  },
});
