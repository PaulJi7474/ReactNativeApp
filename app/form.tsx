import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function FormScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Form – Random Notes!</Text>
        <Text style={styles.subtitle}>A form to store multiline notes.</Text>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Manage Fields</Text>
          </View>
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons
              name="add-circle-outline"
              size={18}
              color="#0A6DFF"
              style={styles.secondaryIcon}
            />
            <Text style={styles.secondaryButtonText}>Add Field</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Add Record Form</Text>
          <View style={styles.noteField}>
            <Text style={styles.fieldLabel}>Note *</Text>
            <View style={styles.fieldInputPlaceholder} />
          </View>
          <TouchableOpacity style={styles.primaryButton}>
            <Ionicons
              name="add"
              size={18}
              color="#FFFFFF"
              style={styles.primaryIcon}
            />
            <Text style={styles.primaryButtonText}>Add Record</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backLink}
        >
          <Ionicons name="chevron-back" size={16} color="#0A6DFF" />
          <Text style={styles.backLinkText}>Back to Welcome</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 24,
    gap: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 16,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#0A6DFF",
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 12,
    gap: 6,
  },
  secondaryIcon: {
    marginRight: 2,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0A6DFF",
  },
  noteField: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#0F172A",
  },
  fieldInputPlaceholder: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    backgroundColor: "#F8FAFF",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A6DFF",
    borderRadius: 999,
    paddingVertical: 14,
    gap: 6,
  },
  primaryIcon: {
    marginRight: 2,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  backLinkText: {
    color: "#0A6DFF",
    fontSize: 14,
    fontWeight: "500",
  },
});