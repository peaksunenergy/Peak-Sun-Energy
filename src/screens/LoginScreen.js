import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { FormInput, FormButton } from '../components/FormElements';
import Header from '../components/Header';
import { useToast } from '../components/Toast';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleLogin() {
    if (!loginId.trim() || !password.trim()) {
      toast('Veuillez remplir tous les champs.', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(loginId.trim(), password);
      // La navigation sera gérée automatiquement par le navigateur
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Header title="Connexion" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="person-circle" size={80} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Espace sécurisé</Text>
        <Text style={styles.subtitle}>
          Connectez-vous avec les identifiants fournis par l'administration.
        </Text>

        <FormInput
          label="Identifiant"
          placeholder="Votre login"
          autoCapitalize="none"
          value={loginId}
          onChangeText={setLoginId}
        />
        <FormInput
          label="Mot de passe"
          placeholder="Votre mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <FormButton
          title={loading ? 'Connexion...' : 'Se connecter'}
          onPress={handleLogin}
          disabled={loading}
        />

        <Text style={styles.hint}>
          Comptes de démo :{'\n'}
          Admin : admin / admin123{'\n'}
          Client : client1 / client123
        </Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  iconContainer: { alignItems: 'center', marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 18,
  },
  hint: {
    fontSize: 11,
    color: COLORS.grayMedium,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
