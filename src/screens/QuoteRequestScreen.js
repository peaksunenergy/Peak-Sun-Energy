import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { CLIENT_TYPES, SERVICE_TYPES } from '../constants/config';
import { validateQuoteForm } from '../utils/validators';
import { submitQuoteRequest } from '../services/api';
import { FormInput, FormPicker, FormButton } from '../components/FormElements';
import Header from '../components/Header';
import { useToast } from '../components/Toast';

export default function QuoteRequestScreen({ navigation }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    clientType: '',
    serviceType: '',
    location: '',
    power: '',
    stegAmount: '',
    stegPower: '',
    stegDocument: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

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

  async function pickDocument() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) {
      updateField('stegDocument', result.assets[0]);
    }
  }

  async function handleSubmit() {
    const validation = validateQuoteForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      await submitQuoteRequest(form);
      toast('Demande de devis envoyée avec succès ✓');
      navigation.goBack();
    } catch (e) {
      toast("Impossible d'envoyer la demande.", 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Header title="Demande de devis" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Remplissez ce formulaire pour recevoir un devis personnalisé.
        </Text>

        <FormInput
          label="Prénom"
          placeholder="Votre prénom"
          value={form.firstName}
          onChangeText={(v) => updateField('firstName', v)}
          error={errors.firstName}
        />
        <FormInput
          label="Nom"
          placeholder="Votre nom"
          value={form.lastName}
          onChangeText={(v) => updateField('lastName', v)}
          error={errors.lastName}
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
          label="Téléphone"
          placeholder="Ex: 55123456"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(v) => updateField('phone', v)}
          error={errors.phone}
          maxLength={8}
        />

        <FormPicker
          label="Type de client"
          options={CLIENT_TYPES}
          value={form.clientType}
          onChange={(v) => updateField('clientType', v)}
          error={errors.clientType}
        />
        <FormPicker
          label="Type de service"
          options={SERVICE_TYPES}
          value={form.serviceType}
          onChange={(v) => updateField('serviceType', v)}
          error={errors.serviceType}
        />

        <FormInput
          label="Localisation"
          placeholder="Ville ou région"
          value={form.location}
          onChangeText={(v) => updateField('location', v)}
          error={errors.location}
        />
        <FormInput
          label="Puissance souhaitée (kW)"
          placeholder="Ex: 3"
          keyboardType="numeric"
          value={form.power}
          onChangeText={(v) => updateField('power', v)}
          error={errors.power}
        />

        {/* Section STEG */}
        <Text style={styles.sectionHeader}>Informations facture STEG</Text>

        <FormInput
          label="Montant de la facture (DT)"
          placeholder="Ex: 150"
          keyboardType="numeric"
          value={form.stegAmount}
          onChangeText={(v) => updateField('stegAmount', v)}
        />
        <FormInput
          label="Puissance souscrite (kW)"
          placeholder="Ex: 6"
          keyboardType="numeric"
          value={form.stegPower}
          onChangeText={(v) => updateField('stegPower', v)}
        />

        <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
          <Ionicons
            name={form.stegDocument ? 'checkmark-circle' : 'cloud-upload'}
            size={22}
            color={form.stegDocument ? COLORS.success : COLORS.primary}
          />
          <Text style={styles.uploadText}>
            {form.stegDocument
              ? 'Facture jointe ✓'
              : 'Joindre une facture (photo)'}
          </Text>
        </TouchableOpacity>

        <FormButton
          title={loading ? 'Envoi en cours...' : 'Envoyer la demande'}
          onPress={handleSubmit}
          disabled={loading}
        />

        <View style={{ height: 40 }} />
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
    lineHeight: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    backgroundColor: COLORS.white,
  },
  uploadText: {
    fontSize: 14,
    color: COLORS.gray,
  },
});
