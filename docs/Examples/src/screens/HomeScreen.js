import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { CLASES } from '../data/clases';
import Card from '../components/Card';
import { colors, spacing, radius, typography } from '../theme';
import { getData } from '../context/StorageContext';
import { STORAGE_KEYS } from '../constants/storageKeys';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('')
  // Se carga el nombre del perfil
  useFocusEffect(
    useCallback(() => {
      const cargarPerfil = async () => {
        const perfil = await getData(STORAGE_KEYS.USER_PROFILE);
        if (perfil && perfil.name) {
          setNombre(perfil.name.trim());
        } else {
          setNombre('');
        }
        if(perfil && perfil.email){
          setCorreo(perfil.email.trim());
        }else{
          setCorreo('')
        }
      };

      cargarPerfil();
    }, [])
  );
  // Filtramos las clases con calificación superior a 4.5
  const clasesRecomendadas = CLASES.filter((clase) => clase.rating > 4.5);

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        {/* Encabezado de bienvenida */}
        <View style={styles.encabezado}>
          <Text style={styles.saludo}>
            {nombre ? `Hola, ${nombre}` : 'Inicia Sesion'}
          </Text>
          <Text style={styles.subtitulo}>{correo ? `${correo}`: ''}</Text>
        </View>

        {/* Sección de Clases Recomendadas */}
        <View style={styles.seccionHeader}>
          <View>
            <Text style={styles.tituloSeccion}>Clases Recomendadas</Text>
            <Text style={styles.descripcionSeccion}>
              Cursos con mejor rating
            </Text>
          </View>
        </View>

        {/* Lista de tarjetas recomendadas */}
        {clasesRecomendadas.map((clase) => (
          <Card
            key={clase.id}
            clase={clase}
            onPress={() =>
              navigation.navigate('ClasesTab', {
                screen: 'DetailClase',
                params: { clase },
              })
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenido: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  encabezado: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  saludo: {
    ...typography.titulo,
    fontSize: 24,
  },
  subtitulo: {
    ...typography.secundario,
    fontSize: 15,
    marginTop: spacing.xs,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.superficie,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borde,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  iconoBanner: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.texto,
  },
  bannerTexto: {
    fontSize: 13,
    color: colors.textoSuave,
    marginTop: 2,
    lineHeight: 18,
  },
  botonExplorar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primario,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  textoBotonExplorar: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  seccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.texto,
  },
  descripcionSeccion: {
    fontSize: 12,
    color: colors.textoSuave,
    marginTop: 2,
  },
  badgeContador: {
    backgroundColor: colors.primarioSuave,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  textoBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primario,
  },
});