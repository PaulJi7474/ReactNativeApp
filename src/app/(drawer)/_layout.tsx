import { Ionicons } from "@expo/vector-icons";
import type { DrawerNavigationOptions } from "@react-navigation/drawer";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import { View } from "react-native";

const drawerScreenOptions: DrawerNavigationOptions = {
  headerTitle: "FormBase",
  headerStyle: { backgroundColor: "#0A6DFF" },
  headerTintColor: "#FFFFFF",
  headerTitleAlign: "center",
  headerLeft: () => (
    <View style={{ marginLeft: 8 }}>
      <DrawerToggleButton tintColor="#FFFFFF" />
    </View>
  ),
  drawerActiveTintColor: "#0A6DFF",
  drawerInactiveTintColor: "#0F172A",
  drawerLabelStyle: { fontSize: 15, fontWeight: "600" },
  drawerItemStyle: { borderRadius: 999, marginHorizontal: 12, paddingVertical: 4 },
  drawerActiveBackgroundColor: "rgba(10, 109, 255, 0.1)",
  sceneStyle: { backgroundColor: "#FFFFFF" }, 
};

export default function DrawerLayout() {
  return (
    <Drawer screenOptions={drawerScreenOptions}>
      <Drawer.Screen
        name="index"
        options={{
          title: "Home",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="about"
        options={{
          title: "About",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="information-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="myForms"
        options={{
          title: "My Forms",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
