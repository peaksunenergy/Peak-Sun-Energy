import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';
import { CLIENT_TYPES, INSTALLATION_STATES } from '../../constants/config';
import { addClient, updateClient } from '../../services/api';
import { FormInput, FormPicker, FormButton } from '../../components/FormElements';
import Header from '../../components/Header';
import { useToast } from '../../components/Toast';

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
  const toast = useToast();

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.phone || !form.location) {
      toast('Veuillez remplir les champs obligatoires.', 'error');
      return;
    }

    if (!isEdit && (!form.login || !form.password)) {
      toast('Le login et le mot de passe sont requis.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await updateClient(existingClient.id, form);
        toast('Client modifié avec succès.');
        navigation.goBack();
      } else {
        await addClient(form);
        toast('Client ajouté avec succès.');
        navigation.goBack();
      }
    } catch (e) {
      toast(e.message, 'error');
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
          onChange={(v) => updateField('usage', v)}
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
