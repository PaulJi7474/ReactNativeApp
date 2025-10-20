import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      <Stack.Screen
        name="form"
        options={({ navigation }) => ({
          title: "FormBase",
          headerStyle: {
            backgroundColor: "#0A6DFF",
          },
          headerTintColor: "#FFFFFF",
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 16 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="addForm"
        options={({ navigation }) => ({
          title: "FormBase",
          headerStyle: {
            backgroundColor: "#0A6DFF",
          },
          headerTintColor: "#FFFFFF",
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 16 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack>
  );
}