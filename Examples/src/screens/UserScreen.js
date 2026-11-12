import React, { useState, useEffect} from 'react';
import { Text, View, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, ActivityIndicator} from 'react-native';

import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import StorageContext, { clearAll } from '../context/StorageContext.js';
import { colors, spacing, radius, typography, coloresPorNivel } from '../theme/index.js'

const INITIAL_USER_DATA = {
    name: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
}

export default function UserScreen () {
    const [userData, setUserData, loading] = useAsyncStorage(
        STORAGE_KEYS.USER_PROFILE || '@userProfile', INITIAL_USER_DATA
    );

    //Para las actuyalizaciones a tiempo real
    const handleChange = (field, text) => {
        const updatedData ={
            ...(userData ?? INITIAL_USER_DATA),
            [field]: text,
        };
        setUserData(updatedData);
    };

    const handleClear = () => {
    Alert.alert(
      'Borrar datos',
      '¿Estás seguro de que deseas eliminar toda tu información de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await clearAll(STORAGE_KEYS.USER_PROFILE || '@user_profile');
            setUserData(INITIAL_USER_DATA);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
        <View style={[styles.container, styles.center]}>
            <ActivityIndicator size="large" color={colors.primario} />
            <Text style={styles.text}>Cargando perfil...</Text>
        </View>
    )
  }
  
  const user = userData ?? INITIAL_USER_DATA;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/*Encabezado*/}
        <View style={styles.header}>
            <Text style={styles.title}>Mi Perfil</Text>
            <Text style={styles.subtitle}>Gestiona tu información personal</Text>
        </View>

        {/*Datos basicos*/}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos Personales</Text>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ingrese su nombre"
                    value={user.name}
                    onChangeText={(text) => handleChange('name', text)}
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Apellido</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ingrese su apellido"
                    value={user.lastName}
                    onChangeText={(text) => handleChange('lastName', text)}
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ingrese su email"
                    value={user.email}
                    onChangeText={(text) => handleChange('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ingrese su teléfono"
                    value={user.phone}
                    onChangeText={(text) => handleChange('phone', text)}
                    keyboardType="phone-pad"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Dirección</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ingrese su dirección"
                    value={user.address}
                    onChangeText={(text) => handleChange('address', text)}
                />
            </View>
            
        </View>

        {/*Sección para borrar datos*/}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reestablecer datos</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={handleClear}>
                <Text style={styles.deleteButtonText}>Borrar</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#F8FAFC',
    flexGrow: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: spacing.sm,
    ...typography.cuerpo,
    color: colors.textoSuave,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.titulo,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.cuerpo,
    color: colors.textoSuave,
  },
  section: {
    marginBottom: spacing.xxl,
    backgroundColor: colors.superficie,
    borderRadius: radius.lg,
    padding: spacing.xl,
    shadowColor: colors.texto,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: {
    ...typography.subtitulo,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.etiqueta,
    color: colors.textoSuave,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borde,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.superficie,
    fontSize: 15,
    fontFamily: typography.fuente || 'sans-serif',
  },
  deleteButton: {
    backgroundColor: colors.peligro,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.superficie,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.fuente || 'sans-serif',
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...typography.secundario,
    color: colors.textoSuave,
  },
});