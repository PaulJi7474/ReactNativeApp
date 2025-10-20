import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddFormScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Add Form</Text>

        <View style={styles.fieldGroup}>
          <TextInput
            placeholder="Form Name"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            accessibilityLabel="Form Name"
          />
          <TextInput
            placeholder="Description"
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.multilineInput]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Description"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} accessibilityRole="button">
          <Ionicons name="save-outline" size={18} color="#FFFFFF" style={styles.saveIcon} />
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          style={styles.backLink}
        >
          <Ionicons name="chevron-back" size={16} color="#0A6DFF" />
          <Text style={styles.backLinkText}>Back</Text>
        </TouchableOpacity> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  fieldGroup: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5F5",
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0F172A",
  },
  multilineInput: {
    minHeight: 120,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A6DFF",
    borderRadius: 999,
    paddingVertical: 16,
    gap: 8,
  },
  saveIcon: {
    marginRight: 2,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
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