import { Stack } from 'expo-router';
import 'react-native-reanimated';


export const unstable_settings = {
  anchor: '(tabs)',
};

// app/_layout.tsx


export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}
