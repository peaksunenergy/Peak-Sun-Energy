import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { validateEmail } from '../utils/validators';
import { forgotPassword } from '../services/api';
import { FormInput, FormButton } from '../components/FormElements';
import Header from '../components/Header';
import { useToast } from '../components/Toast';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  async function handleSubmit() {
    if (!email.trim()) {
      setError("L'email est requis");
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Email invalide');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <Header title="Mot de passe oublié" onBack={() => navigation.goBack()} />
        <View style={styles.content}>
          <Ionicons name="mail-open" size={70} color={COLORS.primary} />
          <Text style={styles.successTitle}>Email envoyé !</Text>
          <Text style={styles.successText}>
            Si un compte existe avec l'adresse {email}, vous recevrez un lien pour réinitialiser votre mot de passe.
          </Text>
          <Text style={styles.hint}>Pensez à vérifier vos spams.</Text>
          <FormButton
            title="Retour à la connexion"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Mot de passe oublié" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Ionicons name="lock-open" size={60} color={COLORS.primary} />
        <Text style={styles.title}>Réinitialisation</Text>
        <Text style={styles.subtitle}>
          Entrez l'adresse email associée à votre compte. Vous recevrez un lien pour créer un nouveau mot de passe.
        </Text>

        <FormInput
          label="Email"
          placeholder="votre@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(v) => { setEmail(v); if (error) setError(''); }}
          error={error}
        />

        <FormButton
          title={loading ? 'Envoi...' : 'Envoyer le lien'}
          onPress={handleSubmit}
          disabled={loading}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    color: COLORS.grayMedium,
    marginBottom: 24,
  },
});
