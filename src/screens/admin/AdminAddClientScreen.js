import React, { useState } from 'react';
import { ScrollView, View, Alert, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { CLIENT_TYPES, INSTALLATION_STATES } from '../../constants/config';
import { addClient, updateClient } from '../../services/api';
import { FormInput, FormPicker, FormButton } from '../../components/FormElements';
import Header from '../../components/Header';

export default function AdminAddClientScreen({ navigation, route }) {
  const existingClient = route.params?.client;
  const isEdit = !!existingClient;

  const [form, setForm] = useState({
    firstName: existingClient?.firstName || '',
    lastName: existingClient?.lastName || '',
    phone: existingClient?.phone || '',
    login: existingClient?.login || '',
    password: existingClient ? '••••••' : '',
    location: existingClient?.location || '',
    usage: existingClient?.usage || '',
    power: existingClient?.power || '',
    characteristics: existingClient?.characteristics || '',
    state: existingClient?.state || 'pending',
    remark: existingClient?.remark || '',
  });
  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.phone || !form.location) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires.');
      return;
    }

    if (!isEdit && (!form.login || !form.password)) {
      Alert.alert('Erreur', 'Le login et le mot de passe sont requis pour un nouveau client.');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await updateClient(existingClient.id, form);
        Alert.alert('Succès', 'Client modifié avec succès.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await addClient(form);
        Alert.alert('Succès', 'Client ajouté avec succès. Les identifiants sont prêts.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Header
        title={isEdit ? 'Modifier le client' : 'Ajouter un client'}
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <FormInput
          label="Prénom *"
          placeholder="Prénom"
          value={form.firstName}
          onChangeText={(v) => updateField('firstName', v)}
        />
        <FormInput
          label="Nom *"
          placeholder="Nom"
          value={form.lastName}
          onChangeText={(v) => updateField('lastName', v)}
        />
        <FormInput
          label="Téléphone *"
          placeholder="Ex: 55123456"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(v) => updateField('phone', v)}
          maxLength={8}
        />

        {!isEdit && (
          <>
            <FormInput
              label="Login (identifiant de connexion) *"
              placeholder="Ex: client_ali"
              autoCapitalize="none"
              value={form.login}
              onChangeText={(v) => updateField('login', v)}
            />
            <FormInput
              label="Mot de passe *"
              placeholder="Mot de passe"
              value={form.password}
              onChangeText={(v) => updateField('password', v)}
            />
          </>
        )}

        <FormInput
          label="Localisation *"
          placeholder="Ville ou région"
          value={form.location}
          onChangeText={(v) => updateField('location', v)}
        />
        <FormPicker
          label="Usage"
          options={CLIENT_TYPES}
          value={form.usage}
          onChange={(v) => {
            const label = CLIENT_TYPES.find((t) => t.value === v)?.label || v;
            updateField('usage', label);
          }}
        />
        <FormInput
          label="Puissance (kW)"
          placeholder="Ex: 3 kW"
          value={form.power}
          onChangeText={(v) => updateField('power', v)}
        />
        <FormInput
          label="Caractéristiques"
          placeholder="Type panneaux, onduleur..."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={form.characteristics}
          onChangeText={(v) => updateField('characteristics', v)}
        />
        <FormPicker
          label="État"
          options={INSTALLATION_STATES}
          value={form.state}
          onChange={(v) => updateField('state', v)}
        />
        <FormInput
          label="Remarque"
          placeholder="Commentaires..."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={form.remark}
          onChangeText={(v) => updateField('remark', v)}
        />

        <FormButton
          title={loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer le client'}
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
});
