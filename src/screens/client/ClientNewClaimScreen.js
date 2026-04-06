import React, { useState } from 'react';
import { ScrollView, View, Text, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { CLAIM_TYPES } from '../../constants/config';
import { validateClaimForm } from '../../utils/validators';
import { submitClaim } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FormInput, FormPicker, FormButton } from '../../components/FormElements';
import Header from '../../components/Header';

export default function ClientNewClaimScreen({ navigation }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    type: '',
    description: '',
    image: null,
  });
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

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) {
      updateField('image', result.assets[0]);
    }
  }

  async function handleSubmit() {
    const validation = validateClaimForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      await submitClaim({
        ...form,
        clientId: user.id,
        clientName: `${user.firstName} ${user.lastName}`,
      });
      Alert.alert(
        'Réclamation envoyée ✓',
        'Votre réclamation a été transmise. Vous pouvez suivre son état depuis votre espace.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'envoyer la réclamation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Header title="Nouvelle réclamation" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <FormPicker
          label="Type de réclamation"
          options={CLAIM_TYPES}
          value={form.type}
          onChange={(v) => updateField('type', v)}
          error={errors.type}
        />

        <FormInput
          label="Description du problème"
          placeholder="Décrivez votre problème en détail..."
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={form.description}
          onChangeText={(v) => updateField('description', v)}
          error={errors.description}
        />

        {form.type === 'technical' && (
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Ionicons
              name={form.image ? 'checkmark-circle' : 'camera'}
              size={22}
              color={form.image ? COLORS.success : COLORS.primary}
            />
            <Text style={styles.uploadText}>
              {form.image ? 'Image jointe ✓' : 'Ajouter une image (optionnel)'}
            </Text>
          </TouchableOpacity>
        )}

        <FormButton
          title={loading ? 'Envoi...' : 'Envoyer la réclamation'}
          onPress={handleSubmit}
          disabled={loading}
        />

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, padding: 20 },
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
