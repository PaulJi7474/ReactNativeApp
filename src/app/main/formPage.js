import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors, sharedStyles } from "../../style/style";
import {
  USERNAME,
  createField,
  fetchFieldsByFormId,
  getFormById,
} from "../app";

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
  const [fieldNameError, setFieldNameError] = useState("");
  const [isSavingField, setIsSavingField] = useState(false);
  const [fields, setFields] = useState([])
  const [recordNote, setRecordNote] = useState("");
  const [recordLocation, setRecordLocation] = useState(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [recordPhoto, setRecordPhoto] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [isSelectingPhoto, setIsSelectingPhoto] = useState(false);

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
    if (fieldType !== "Image/Photo") {
      setRecordPhoto(null);
      setPhotoError("");
      setIsSelectingPhoto(false);
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

  const handleSelectPhotoPress = async () => {
    if (isSelectingPhoto) {
      return;
    }

    try {
      setIsSelectingPhoto(true);
      setPhotoError("");

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        setPhotoError("Photo permission is required to add an image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        setRecordPhoto(result.assets[0]);
      }
    } catch (err) {
      console.error("Failed to select photo", err);
      setPhotoError("Unable to pick a photo. Please try again.");
    } finally {
      setIsSelectingPhoto(false);
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

  useEffect(() => {
    let isActive = true;

    const loadFields = async () => {
      if (!formId) {
        return;
      }

      try {
        const data = await fetchFieldsByFormId(formId);
        if (!isActive) {
          return;
        }

        if (Array.isArray(data)) {
          setFields(data);
        } else if (data) {
          setFields([data]);
        } else {
          setFields([]);
        }
      } catch (err) {
        console.error("Failed to load fields", err);
        if (isActive) {
          setFields([]);
        }
      }
    };

    loadFields();

    return () => {
      isActive = false;
    };
  }, [formId]);

  const resetFieldForm = () => {
    setFieldName("");
    setFieldType("Single Line Text");
    setIsRequired(false);
    setStoresNumericValues(false);
    setIsTypeMenuOpen(false);
    setFieldNameError("");
  };

  const handleSaveField = async () => {
    if (isSavingField) {
      return;
    }

    const trimmedName = fieldName.trim();

    if (!trimmedName) {
      setFieldNameError("Field name required");
      return;
    }

    setFieldNameError("");

    try {
      setIsSavingField(true);
      const numericFormId = Number(formId);
      const formIdValue = Number.isNaN(numericFormId) ? formId : numericFormId;
      const highestOrderIndex = fields.reduce((max, field) => {
        const current = Number(field?.order_index);
        return Number.isFinite(current) && current > max ? current : max;
      }, 0);
      const orderIndex = highestOrderIndex + 1;
      const payload = {
        id: Math.trunc(Date.now() / 1000000),
        form_id: formIdValue,
        name: trimmedName,
        field_type: fieldType,
        options: "",
        required: isRequired ? "yes" : "no",
        is_num: storesNumericValues ? "yes" : "no",
        order_index: orderIndex,
        username: USERNAME,
      };

      const response = await createField(payload);
      const createdField = Array.isArray(response) ? response[0] : response;

      if (createdField) {
        setFields((prev) => {
          if (prev.length === 0) {
            return [createdField];
          }

          const updated = [...prev, createdField];
          return updated.sort((a, b) => {
            const aIndex = Number(a?.order_index) || 0;
            const bIndex = Number(b?.order_index) || 0;
            return aIndex - bIndex;
          });
        });
      }

      setShowFieldForm(false);
      resetFieldForm();
    } catch (err) {
      console.error("Failed to create field", err);
      Alert.alert("Error", "We couldn't save that field. Please try again.");
    } finally {
      setIsSavingField(false);
    }
  };

  return (
    <SafeAreaProvider  style={styles.safeArea}>
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
                  resetFieldForm();
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
                  style={[
                    styles.textInput,
                    fieldNameError ? styles.inputError : null,
                  ]}
                  placeholder="Field name"
                  placeholderTextColor="#94A3B8"
                  value={fieldName}
                  onChangeText={(value) => {
                    setFieldName(value);
                    if (fieldNameError && value.trim()) {
                      setFieldNameError("");
                    }
                  }}
                />
                {fieldNameError ? (
                  <Text style={styles.fieldErrorText}>{fieldNameError}</Text>
                ) : null}
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
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isSavingField && styles.primaryButtonDisabled,
                ]}
                accessibilityRole="button"
                onPress={handleSaveField}
                disabled={isSavingField}
              >
                {isSavingField ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Ionicons
                    name="add"
                    size={18}
                    color={colors.white}
                    style={styles.primaryIcon}
                  />
                )}
                <Text style={styles.primaryButtonText}>Save Field</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setShowFieldForm(true);
                resetFieldForm();
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
                style={[styles.recordInput, styles.recordInputMultiline]}
                placeholder="Add a note"
                placeholderTextColor="#94A3B8"
                value={recordNote}
                onChangeText={setRecordNote}
                multiline
              />
            ) : fieldType === "Single Line Text" ? (
              <TextInput
                style={[styles.recordInput, styles.recordInputSingleLine]}
                placeholder="Add a note"
                placeholderTextColor="#94A3B8"
                value={recordNote}
                onChangeText={setRecordNote}
                multiline={false}
              />
            ) : fieldType === "Multi Line Text" ? (
              <TextInput
                style={[styles.recordInput, styles.recordInputMultiline]}
                placeholder="Add a note"
                placeholderTextColor="#94A3B8"
                value={recordNote}
                onChangeText={setRecordNote}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            ) : fieldType === "Image/Photo" ? (
              <TextInput
                style={[styles.recordInput, styles.recordInputSingleLine]}
                placeholder="Add a note"
                placeholderTextColor="#94A3B8"
                value={recordNote}
                onChangeText={setRecordNote}
                multiline={false}
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
          ) : fieldType === "Image/Photo" ? (
            <View style={styles.photoField}>
              <TouchableOpacity
                style={styles.photoButton}
                accessibilityRole="button"
                onPress={handleSelectPhotoPress}
                disabled={isSelectingPhoto}
              >
                <Ionicons
                  name="image-outline"
                  size={18}
                  color={colors.blue}
                  style={styles.photoIcon}
                />
                <Text style={styles.photoButtonText}>Photo (* Required)</Text>
                {isSelectingPhoto ? (
                  <ActivityIndicator size="small" color={colors.blue} />
                ) : null}
              </TouchableOpacity>
              {recordPhoto ? (
                <Text style={styles.photoInfoText} numberOfLines={1}>
                  {recordPhoto.fileName ?? recordPhoto.uri}
                </Text>
              ) : photoError ? (
                <Text style={styles.photoErrorText}>{photoError}</Text>
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
    </SafeAreaProvider >
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
  inputError: {
    borderColor: colors.red,
  },
  fieldErrorText: {
    color: colors.red,
    fontSize: 13,
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
  },
  recordInputSingleLine: {
    textAlignVertical: "center",
  },
  recordInputMultiline: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  primaryButton: {
    ...sharedStyles.primaryButton,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
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
  photoField: {
    gap: 8,
    marginTop: 8,
  },
  photoButton: {
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  photoButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.blue,
    flex: 1,
  },
  photoIcon: {
    marginRight: 4,
  },
  photoInfoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  photoErrorText: {
    fontSize: 13,
    color: colors.red,
  },

});