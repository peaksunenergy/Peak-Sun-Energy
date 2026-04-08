import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { validateRegisterForm } from '../utils/validators';
import { registerUser } from '../services/api';
import { FormInput, FormPicker, FormButton } from '../components/FormElements';
import Header from '../components/Header';
import { useToast } from '../components/Toast';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    confirmPassword: '',
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

  async function handleRegister() {
    const validation = validateRegisterForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      await registerUser(data);
      toast('Compte créé ! Vérifiez votre email pour activer votre compte.', 'success');
      navigation.navigate('Login');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Header title="Créer un compte" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-add" size={60} color={COLORS.primary} />
          </View>

          <Text style={styles.subtitle}>
            Créez votre compte client. Un email de validation vous sera envoyé.
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
            maxLength={8}
            value={form.phone}
            onChangeText={(v) => updateField('phone', v)}
            error={errors.phone}
          />
          <FormPicker
            label="Type de compte"
            options={[
              { label: 'Client', value: 'client' },
              { label: 'Technicien', value: 'technician' },
              { label: 'Admin', value: 'admin' },
            ]}
            value={form.role}
            onChange={(v) => updateField('role', v)}
            error={errors.role}
          />
          <FormInput
            label="Mot de passe"
            placeholder="Minimum 6 caractères"
            secureTextEntry
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            error={errors.password}
          />
          <FormInput
            label="Confirmer le mot de passe"
            placeholder="Retapez le mot de passe"
            secureTextEntry
            value={form.confirmPassword}
            onChangeText={(v) => updateField('confirmPassword', v)}
            error={errors.confirmPassword}
          />

          <FormButton
            title={loading ? 'Création...' : 'Créer mon compte'}
            onPress={handleRegister}
            disabled={loading}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, padding: 24 },
  iconContainer: { alignItems: 'center', marginBottom: 12, marginTop: 8 },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
});
