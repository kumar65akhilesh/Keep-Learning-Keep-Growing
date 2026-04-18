import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform, Text } from 'react-native';
import * as Font from 'expo-font';
import { Colors } from '../constants/theme';

// Only prevent auto-hide on native (causes issues on web)
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

/**
 * Root layout — handles font loading, splash screen, and navigation stack.
 */
export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          Nunito_400Regular: require('@expo-google-fonts/nunito/Nunito_400Regular.ttf'),
          Nunito_600SemiBold: require('@expo-google-fonts/nunito/Nunito_600SemiBold.ttf'),
          Nunito_700Bold: require('@expo-google-fonts/nunito/Nunito_700Bold.ttf'),
          Nunito_800ExtraBold: require('@expo-google-fonts/nunito/Nunito_800ExtraBold.ttf'),
        });
      } catch (e) {
        // If fonts fail to load, continue without custom fonts
        console.warn('Failed to load Nunito fonts, using system fonts:', e);
      } finally {
        setFontsLoaded(true);
        if (Platform.OS !== 'web') {
          SplashScreen.hideAsync();
        }
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: Colors.softWhite },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen
          name="camera"
          options={{ title: 'Camera', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="result" options={{ title: 'Result' }} />
        <Stack.Screen
          name="tracing"
          options={{ title: 'Tracing Practice', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="handwrite"
          options={{ title: 'Handwriting', animation: 'slide_from_right' }}
        />
        <Stack.Screen name="history" options={{ title: 'History' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
