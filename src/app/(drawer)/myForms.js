import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { deleteForm, fetchForms } from "../app";

export default function MyFormsScreen() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadForms = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }
      const response = await fetchForms();
      setForms(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to load forms", error);
      Alert.alert("Error", "Unable to load forms. Please try again later.");
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadForms();
    }, [loadForms])
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadForms(false);
    } finally {
      setRefreshing(false);
    }
  }, [loadForms]);

  const handleDelete = useCallback(
    (id) => {
      Alert.alert("Delete Form", "Are you sure you want to delete this form?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteForm(id);
              await loadForms();
            } catch (error) {
              console.error("Failed to delete form", error);
              Alert.alert("Error", "Unable to delete the form. Please try again later.");
            }
          },
        },
      ]);
    },
    [loadForms]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View>
        <TouchableOpacity
          style={styles.addButton}
          accessibilityRole="button"
          onPress={() => router.push("/addForm")}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" style={styles.addIcon} />
          <Text style={styles.addButtonText}>Add Form</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A6DFF" />
        </View>
      ) : forms.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No forms yet</Text>
          <Text style={styles.emptyDescription}>
            Create your first form by tapping the “Add Form” button above.
          </Text>
        </View>
      ) : (
        <View style={styles.formsList}>
          {forms.map((form) => (
            <View key={form.id} style={styles.formCard}>
              <Text style={styles.formTitle}>{form.name}</Text>
              {form.description ? (
                <Text style={styles.formDescription}>{form.description}</Text>
              ) : null}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.viewButton]}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/form",
                      params: {
                        formId: String(form.id),
                        formName: form.name,
                        formDescription: form.description ?? "",
                      },
                    })
                  }
                >
                  <Ionicons name="eye-outline" size={16} color="#0A6DFF" />
                  <Text style={[styles.actionText, styles.viewText]}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/addForm",
                      params: { formId: String(form.id) },
                    })
                  }
                >
                  <Ionicons name="create-outline" size={16} color="#1E293B" />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  accessibilityRole="button"
                  onPress={() => handleDelete(form.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
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
    gap: 28,
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
  formsList: {
    gap: 16,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
    gap: 12,
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
  loadingContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  viewButton: {
    backgroundColor: "#E7F1FF",
  },
  viewText: {
    color: "#0A6DFF",
  },
  editButton: {
    backgroundColor: "#E2E8F0",
  },
  deleteButton: {
    backgroundColor: "#DC2626",
  },
  deleteText: {
    color: "#FFFFFF",
  },
});