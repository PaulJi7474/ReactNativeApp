import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getFormById } from "../app";

export default function FormScreen() {
  const { formId: formIdParam, formName, formDescription } = useLocalSearchParams();
  const formId = Array.isArray(formIdParam) ? formIdParam[0] : formIdParam;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: formName,
    description: formDescription,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadForm = async () => {
      if (!formId) {
        setError("No form selected.");
        return;
      }

      try {
        setLoading(true);
        const data = await getFormById(formId);
        if (isActive) {
          if (data) {
            setForm({ name: data.name, description: data.description });
            setError("");
          } else {
            setError("We couldn't find that form.");
          }
        }
      } catch (err) {
        console.error("Failed to load form", err);
        if (isActive) {
          setError("Unable to load form details. Please try again later.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadForm();

    return () => {
      isActive = false;
    };
  }, [formId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0A6DFF" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.heading}>{form?.name || "Form"}</Text>
            {form?.description ? (
              <Text style={styles.subtitle}>{form.description}</Text>
            ) : null}
          </>
        )}

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
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
  },
  cancelButtonText: {
    color: "#B91C1C",
    fontSize: 14,
    fontWeight: "600",
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
  manageContent: {
    gap: 16,
    backgroundColor: "#F8FAFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  manageSubtitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  inputGroup: {
    gap: 8,
  },
  noteField: {
    gap: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#CBD5F5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  dropdownMock: {
    borderWidth: 1,
    borderColor: "#CBD5F5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "500",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "500",
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
  loadingContainer: {
    alignItems: "center",
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 14,
    textAlign: "center",
  },
});