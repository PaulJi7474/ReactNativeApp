import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
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
  const [fieldType, setFieldType] = useState("Single Line Text");
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [storesNumericValues, setStoresNumericValues] = useState(false);
  const [recordNote, setRecordNote] = useState("");
  const [recordLocation, setRecordLocation] = useState(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const FIELD_TYPE_OPTIONS = [
    "Single Line Text",
    "Multi Line Text",
    "Dropdown",
    "Location",
    "Image/Photo",
  ]

  useEffect(() => {
    if (fieldType !== "Location") {
      setRecordLocation(null);
      setIsRequestingLocation(false);
      setLocationError("");
    }
  }, [fieldType]);

  const handleLocationPress = async () => {
    if (isRequestingLocation) {
      return;
    }

    try {
      setIsRequestingLocation(true);
      setLocationError("");

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationError("Location permission is required to add your position.");
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = currentPosition.coords;
      setRecordLocation({ latitude, longitude });
    } catch (err) {
      console.error("Failed to fetch location", err);
      setLocationError("Unable to get your location. Please try again.");
    } finally {
      setIsRequestingLocation(false);
    }
  };

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
                  setIsTypeMenuOpen(false);
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
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsTypeMenuOpen((prev) => !prev)}
                  style={styles.dropdownMock}
                  accessibilityRole="button"
                  accessibilityLabel="Field type"
                >
                  <Text style={styles.dropdownText}>{fieldType}</Text>
                  <Ionicons
                    name={isTypeMenuOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#1E293B"
                  />
                </TouchableOpacity>
                {isTypeMenuOpen ? (
                  <View style={styles.dropdownList}>
                    {FIELD_TYPE_OPTIONS.map((option) => {
                      const selected = option === fieldType;
                      return (
                        <TouchableOpacity
                          key={option}
                          onPress={() => {
                            setFieldType(option);
                            setIsTypeMenuOpen(false);
                          }}
                          style={[
                            styles.dropdownOption,
                            selected && styles.dropdownOptionSelected,
                          ]}
                          accessibilityRole="button"
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              selected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
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
              onPress={() => {
                setShowFieldForm(true);
                setIsTypeMenuOpen(false);
              }}
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
            {fieldType === "Location" ? (
              <TextInput
                style={styles.recordInput}
                placeholder="Add a note"
                placeholderTextColor="#94A3B8"
                value={recordNote}
                onChangeText={setRecordNote}
                multiline
              />
            ) : (
              <View style={styles.fieldInputPlaceholder} />
            )}
          </View>
          {fieldType === "Location" ? (
            <View style={styles.locationField}>
              <TouchableOpacity
                style={styles.locationButton}
                accessibilityRole="button"
                onPress={handleLocationPress}
                disabled={isRequestingLocation}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={colors.blue}
                  style={styles.locationIcon}
                />
                <Text style={styles.locationButtonText}>Location (* Required)</Text>
                {isRequestingLocation ? (
                  <ActivityIndicator size="small" color={colors.blue} />
                ) : null}
              </TouchableOpacity>
              {recordLocation ? (
                <Text style={styles.locationInfoText}>
                  Lat: {recordLocation.latitude.toFixed(6)}, Lng: {recordLocation.longitude.toFixed(6)}
                </Text>
              ) : locationError ? (
                <Text style={styles.locationErrorText}>{locationError}</Text>
              ) : null}
            </View>
          ) : null}
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
  dropdownList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.inputMutedBackground,
  },
  dropdownOptionText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  dropdownOptionTextSelected: {
    fontWeight: "600",
    color: colors.blue,
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
  recordInput: {
    ...sharedStyles.input,
    minHeight: 120,
    textAlignVertical: "top",
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
  locationField: {
    gap: 8,
    marginTop: 8,
  },
  locationButton: {
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.blue,
    flex: 1,
  },
  locationIcon: {
    marginRight: 4,
  },
  locationInfoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  locationErrorText: {
    fontSize: 13,
    color: colors.red,
  },
});