import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors, sharedStyles } from "../style/style";
import { createForm, getFormById, updateForm } from "./app";

export default function AddFormScreen() {
  const router = useRouter();
  const { formId: formIdParam } = useLocalSearchParams();
  const formId = Array.isArray(formIdParam) ? formIdParam[0] : formIdParam;
  const isEditing = Boolean(formId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);

  useEffect(() => {
    let isActive = true;

    const fetchForm = async () => {
      if (!formId) {
        setName("");
        setDescription("");
        return;
      }

      try {
        setLoadingForm(true);
        const existing = await getFormById(formId);
        if (existing && isActive) {
          setName(existing.name ?? "");
          setDescription(existing.description ?? "");
        }
      } catch (error) {
        console.error("Failed to load form", error);
        Alert.alert("Error", "Unable to load the selected form. Please try again later.");
      } finally {
        if (isActive) {
          setLoadingForm(false);
        }
      }
    };

    fetchForm();

    return () => {
      isActive = false;
    };
  }, [formId]);

  const handleValidation = () => {
    const nextErrors = {};
    if (!name.trim()) {
      nextErrors.name = "Required";
    }
    if (!description.trim()) {
      nextErrors.description = "Required";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    if (!handleValidation()) {
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        description: description.trim(),
      };

      if (isEditing) {
        await updateForm(formId, payload);
      } else {
        await createForm(payload);
      }

      router.back();
    } catch (error) {
      console.error("Failed to save form", error);
      Alert.alert(
        "Error",
        error?.message ?? "Unable to save the form right now. Please try again later."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaProvider style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{isEditing ? "Edit Form" : "Add Form"}</Text>

        <View style={styles.fieldGroup}>
          <TextInput
            placeholder="Form Name"
            placeholderTextColor= "colors.white"//"#94A3B8"
            style={styles.input}
            accessibilityLabel="Form Name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            editable={!loadingForm}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          <TextInput
            placeholder="Description"
            placeholderTextColor="colors.white"//"#94A3B8"
            style={[styles.input, styles.multilineInput]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Description"
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
            editable={!loadingForm}
          />
          {errors.description ? (
            <Text style={styles.errorText}>{errors.description}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, submitting && styles.disabledButton]}
          accessibilityRole="button"
          onPress={handleSubmit}
          disabled={submitting || loadingForm}
        >
          {submitting ? ( 
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Ionicons
              name="save-outline"
              size={18}
              color={colors.primaryText}
              style={styles.saveIcon}
            />
          )}
          <Text style={styles.saveButtonText}>{isEditing ? "Update" : "Add Form"}</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          style={styles.backLink}
        >
          <Ionicons name="chevron-back" size={16} color="colors.blue" />
          <Text style={styles.backLinkText}>Back</Text>
        </TouchableOpacity> */}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
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
    color: colors.textPrimary,
  },
  input: {
    ...sharedStyles.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: colors.inputMutedBackground,
  },
  multilineInput: {
    minHeight: 120,
  },
  saveButton: {
    ...sharedStyles.primaryButton,
    paddingVertical: 16,
    gap: 8,
  },
  saveIcon: {
    ...sharedStyles.primaryIcon,
  },
  saveButtonText: {
    ...sharedStyles.primaryButtonText,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.7,
  },
  backLink: {
    ...sharedStyles.backLink,
  },
  backLinkText: {
    ...sharedStyles.backLinkText,
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
});