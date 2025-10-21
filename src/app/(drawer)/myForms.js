import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { deleteForm, fetchForms } from "../app";

const HIDDEN_DESCRIPTION = "A form to store details about my programming books";

export default function MyFormsScreen() {
  const router = useRouter();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadForms = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const results = await fetchForms();
      const filtered = Array.isArray(results)
        ? results.filter((form) => form.description !== HIDDEN_DESCRIPTION)
        : [];
      setForms(filtered);
    } catch (err) {
      console.error("Failed to load forms", err);
      setError("Unable to load your forms right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadForms();
    }, [loadForms])
  );

  const handleDelete = async (id) => {
    if (deletingId) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteForm(id);
      setForms((prev) => prev.filter((form) => form.id !== id));
    } catch (err) {
      console.error("Failed to delete form", err);
      Alert.alert("Error", "We couldn't delete that form. Please try again later.");
    } finally {
      setDeletingId(null);
    }
  };

  const navigateToForm = (form) => {
    router.push({
      pathname: "/form",
      params: {
        formId: form.id,
        formName: form.name,
        formDescription: form.description,
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View>
        <TouchableOpacity
          style={styles.addButton}
          accessibilityRole="button"
          onPress={() => router.push("/addForm")}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" style={styles.addIcon} />
          <Text style={styles.addButtonText}>Add Forms</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A6DFF" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={20} color="#B91C1C" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={loadForms}
            accessibilityRole="button"
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : forms.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={40} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No forms yet</Text>
          <Text style={styles.emptyDescription}>
            Create your first form to start collecting data.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {forms.map((form) => (
            <View key={form.id} style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>{form.name}</Text>
                {form.description ? (
                  <Text style={styles.formDescription}>{form.description}</Text>
                ) : null}
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.viewButton]}
                  accessibilityRole="button"
                  onPress={() => navigateToForm(form)}
                >
                  <Ionicons name="eye-outline" size={16} color="#0A6DFF" />
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({ pathname: "/addForm", params: { formId: form.id } })
                  }
                >
                  <Ionicons name="create-outline" size={16} color="#0A6DFF" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  accessibilityRole="button"
                  onPress={() => handleDelete(form.id)}
                  disabled={deletingId === form.id}
                >
                  {deletingId === form.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                  )}
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 24,
    paddingBottom: 40,
    gap: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A6DFF",
    borderRadius: 999,
    paddingVertical: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 2,
  },
  addIcon: {
    marginRight: 6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    alignItems: "center",
  },
  errorText: {
    color: "#B91C1C",
    textAlign: "center",
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(185, 28, 28, 0.1)",
  },
  retryButtonText: {
    color: "#B91C1C",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAFF",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
  },
  list: {
    gap: 16,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    gap: 16,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  formHeader: {
    gap: 6,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  formDescription: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  viewButton: {
    borderWidth: 1,
    borderColor: "#0A6DFF",
    backgroundColor: "rgba(10, 109, 255, 0.08)",
  },
  editButton: {
    borderWidth: 1,
    borderColor: "#0A6DFF",
    backgroundColor: "#FFFFFF",
  },
  deleteButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 18,
  },
  viewButtonText: {
    color: "#0A6DFF",
    fontSize: 14,
    fontWeight: "600",
  },
  editButtonText: {
    color: "#0A6DFF",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});