import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, sharedStyles } from "../../style/style";
import { getFormById } from "../app";

const NO_FORM_SELECTED_ERROR = "No form selected.";

export default function FormScreen() {
  const { formId: formIdParam, formName, formDescription } = useLocalSearchParams();
  const formId = Array.isArray(formIdParam) ? formIdParam[0] : formIdParam;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: formName,
    description: formDescription,
  });
  const [error, setError] = useState("");
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [storesNumericValues, setStoresNumericValues] = useState(false);

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
            <ActivityIndicator size="large" color={colors.blue} />
          </View>
        ) : error && error !== NO_FORM_SELECTED_ERROR ? (
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
            {showFieldForm ? (
              <TouchableOpacity
                onPress={() => {
                  setShowFieldForm(false);
                  setFieldName("");
                  setIsRequired(false);
                  setStoresNumericValues(false);
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {showFieldForm ? (
            <View style={styles.manageContent}>
              <Text style={styles.manageSubtitle}>Add a Field</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Field name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Field name"
                  placeholderTextColor="#94A3B8"
                  value={fieldName}
                  onChangeText={setFieldName}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Field type</Text>
                <View style={styles.dropdownMock}>
                  <Text style={styles.dropdownText}>Single Line Text</Text>
                  <Ionicons name="chevron-down" size={18} color="#1E293B" />
                </View>
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Required</Text>
                <Switch
                  value={isRequired}
                  onValueChange={setIsRequired}
                  trackColor={{ false: colors.inputBorder, true: colors.blue }}
                  thumbColor={colors.white}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Stores Numeric Values</Text>
                <Switch
                  value={storesNumericValues}
                  onValueChange={setStoresNumericValues}
                  trackColor={{ false: colors.inputBorder, true: colors.blue }}
                  thumbColor={colors.white}
                />
              </View>
              <TouchableOpacity style={styles.primaryButton}>
                <Ionicons
                  name="add"
                  size={18}
                  color={colors.white}
                  style={styles.primaryIcon}
                />
                <Text style={styles.primaryButtonText}>Save Field</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowFieldForm(true)}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={colors.blue}
                style={styles.secondaryIcon}
              />
              <Text style={styles.secondaryButtonText}>Add Field</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Add Record Form</Text>
          <View style={styles.noteField}>
            <Text style={styles.fieldLabel}>Note *</Text>
            <View style={styles.fieldInputPlaceholder} />
          </View>
          <TouchableOpacity style={styles.primaryButton}>
            {/* <Ionicons
              name="add"
              size={18}
              color={colors.white}
              style={styles.primaryIcon}
            /> */}
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
    backgroundColor: colors.backgroundMuted,
  },
  container: {},
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    ...sharedStyles.card,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    ...sharedStyles.sectionTitle,
  },
  cancelButton: {
    ...sharedStyles.cancelButton,
  },
  cancelButtonText: {
    ...sharedStyles.cancelButtonText,
  },
  secondaryButton: {
    ...sharedStyles.secondaryButton,
  },
  secondaryIcon: {
    ...sharedStyles.secondaryIcon,
  },
  secondaryButtonText: {
    ...sharedStyles.secondaryButtonText,
  },
  manageContent: {
    gap: 16,
    backgroundColor: colors.inputMutedBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  manageSubtitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  inputGroup: {
    gap: 8,
  },
  noteField: {
    gap: 8,
  },
  textInput: {
    ...sharedStyles.input,
  },
  dropdownMock: {
    ...sharedStyles.input,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  fieldLabel: {
    ...sharedStyles.fieldLabel,
  },
  fieldInputPlaceholder: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputMutedBackground,
  },
  primaryButton: {
    ...sharedStyles.primaryButton,
  },
  primaryIcon: {
    ...sharedStyles.primaryIcon,
  },
  primaryButtonText: {
    ...sharedStyles.primaryButtonText,
  },
  backLink: {
    ...sharedStyles.backLink,
  },
  backLinkText: {
    ...sharedStyles.backLinkText,
  },
  loadingContainer: {
    alignItems: "center",
  },
  errorContainer: {
    backgroundColor: colors.destructiveBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.destructiveBorder,
  },
  errorText: {
    color: colors.red,
    fontSize: 14,
    textAlign: "center",
  },
});