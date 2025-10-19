import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";

const headerOptions = {
  title: "FormBase",
  headerStyle: {
    backgroundColor: "#0A6DFF",
  },
  headerTintColor: "#FFFFFF",
  headerTitleAlign: "center" as const,
  headerLeft: () => (
    <Ionicons 
      name="menu" 
      size={24} 
      color="#FFFFFF" 
      style={{ marginLeft: 16 }} 
    />
  ),
};

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={headerOptions} />
      <Stack.Screen name="form" options={headerOptions} />
    </Stack>
  );
}