# Intégration Mobile (React Native)

Guide pour intégrer l'authentification par SMS dans ton app mobile React Native.

## Installation

```bash
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
```

## Configuration

### 1. Configuration Firebase

Suis la doc officielle pour configurer Firebase dans ton projet React Native :
- [iOS Setup](https://rnfirebase.io/#2-ios-setup)
- [Android Setup](https://rnfirebase.io/#3-android-setup)

### 2. Configuration Phone Auth

#### iOS
Ajoute dans `Info.plist` :
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR-APP-ID</string>
    </array>
  </dict>
</array>
```

#### Android
Rien de spécial, Firebase gère automatiquement la vérification.

## Code d'authentification

### Écran de connexion

```javascript
import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);

  // Étape 1 : Vérifier le numéro et envoyer le code
  const sendCode = async () => {
    setLoading(true);
    
    try {
      // 1. Vérifier si le numéro existe dans Firestore
      const scannerQuery = await firestore()
        .collection('users')
        .where('phoneNumber', '==', phoneNumber)
        .where('role', '==', 'scanner')
        .get();

      if (scannerQuery.empty) {
        Alert.alert('Erreur', 'Ce numéro n\'est pas enregistré. Contacte un administrateur.');
        setLoading(false);
        return;
      }

      const scannerDoc = scannerQuery.docs[0];
      const scanner = scannerDoc.data();
      
      // Vérifier si le scanner est actif (si le champ existe)
      if (scanner.hasOwnProperty('isActive') && !scanner.isActive) {
        Alert.alert('Erreur', 'Ton compte a été désactivé.');
        setLoading(false);
        return;
      }

      // 2. Envoyer le code SMS via Firebase
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      setConfirm(confirmation);
      
      Alert.alert('Succès', 'Code envoyé par SMS !');
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le code.');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Vérifier le code SMS
  const verifyCode = async () => {
    setLoading(true);
    
    try {
      await confirm.confirm(code);
      // L'utilisateur est maintenant connecté
      // Firebase Auth gère automatiquement la session
      navigation.replace('Scanner');
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Code incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 20 }}>
        Hirrdé Scanner
      </Text>

      {!confirm ? (
        // Étape 1 : Numéro de téléphone
        <>
          <TextInput
            placeholder="+33612345678"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              borderRadius: 8,
              marginBottom: 10
            }}
          />
          <Button
            title={loading ? 'Envoi...' : 'Recevoir le code'}
            onPress={sendCode}
            disabled={loading || !phoneNumber}
          />
        </>
      ) : (
        // Étape 2 : Code de vérification
        <>
          <Text style={{ marginBottom: 10 }}>
            Code envoyé au {phoneNumber}
          </Text>
          <TextInput
            placeholder="123456"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              borderRadius: 8,
              marginBottom: 10,
              fontSize: 24,
              textAlign: 'center'
            }}
          />
          <Button
            title={loading ? 'Vérification...' : 'Vérifier'}
            onPress={verifyCode}
            disabled={loading || code.length !== 6}
          />
          <Button
            title="Changer de numéro"
            onPress={() => {
              setConfirm(null);
              setCode('');
            }}
          />
        </>
      )}
    </View>
  );
}
```

### Hook d'authentification

```javascript
import { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export function useScanner() {
  const [user, setUser] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (authUser) => {
      if (authUser) {
        // Récupérer le profil scanner
        try {
          const scannerDoc = await firestore()
            .collection('users')
            .where('phoneNumber', '==', authUser.phoneNumber)
            .where('role', '==', 'scanner')
            .get();

          if (!scannerDoc.empty) {
            setScanner({
              id: scannerDoc.docs[0].id,
              ...scannerDoc.docs[0].data()
            });
          }
        } catch (error) {
          console.error('Erreur chargement scanner:', error);
        }
      } else {
        setScanner(null);
      }
      
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => auth().signOut();

  return { user, scanner, loading, logout };
}
```

### Écran de scan

```javascript
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useScanner } from '../hooks/useScanner';

export default function ScannerScreen() {
  const { scanner, logout } = useScanner();

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 10 }}>
        Bienvenue {scanner?.name}
      </Text>
      <Text style={{ marginBottom: 20 }}>
        {scanner?.phoneNumber}
      </Text>

      {/* Ton interface de scan ici */}
      
      <Button title="Déconnexion" onPress={logout} />
    </View>
  );
}
```

## Navigation

```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useScanner } from './hooks/useScanner';
import LoginScreen from './screens/LoginScreen';
import ScannerScreen from './screens/ScannerScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const { user, loading } = useScanner();

  if (loading) {
    return null; // Ou un écran de chargement
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Scanner" component={ScannerScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## Tests

### Test sur émulateur Android

Firebase Phone Auth fonctionne automatiquement sur les émulateurs Android.

### Test sur simulateur iOS

Pour tester sur simulateur iOS, tu dois configurer des numéros de test dans Firebase Console :

1. Va dans **Authentication** > **Sign-in method** > **Phone**
2. Scroll jusqu'à "Phone numbers for testing"
3. Ajoute un numéro de test (ex: +33600000000) avec un code (ex: 123456)

## Sécurité

### Règles Firestore

Les règles sont déjà configurées dans `AUTHENTICATION.md`. Assure-toi de les déployer :

```bash
firebase deploy --only firestore:rules
```

### Vérification du rôle

Le rôle est vérifié à deux niveaux :
1. **Avant l'envoi du SMS** : On vérifie que le numéro existe et est actif
2. **Après la connexion** : On récupère le profil pour s'assurer que c'est un scanner

## Dépannage

### "This app is not authorized to use Firebase Authentication"

- Vérifie que ton SHA-1 est bien configuré dans Firebase Console (Android)
- Vérifie que ton Bundle ID est correct (iOS)

### "We have blocked all requests from this device due to unusual activity"

- Firebase a détecté trop de tentatives
- Attends quelques heures ou utilise un numéro de test

### Le code SMS n'arrive pas

- Vérifie que Phone Auth est activé dans Firebase Console
- Vérifie que ton quota SMS n'est pas dépassé
- Utilise un numéro de test pour le développement
