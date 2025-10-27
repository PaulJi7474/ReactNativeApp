import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
  updateField,
} from "../app";

const NO_FORM_SELECTED_ERROR = "No form selected.";

function fieldStoresNumericValues(field) {
  if (!field) {
    return false;
  }

  const rawValue =
    field.is_num ??
    field.isNum ??
    field.storesNumericValues ??
    field.stores_numeric_values ??
    null;

  if (typeof rawValue === "string") {
    const normalised = rawValue.trim().toLowerCase();
    return normalised === "yes" || normalised === "true" || normalised === "1";
  }

  if (typeof rawValue === "number") {
    return rawValue === 1;
  }

  return Boolean(rawValue);
}

// eslint-disable-next-line import/namespace
const documentDirectory = FileSystem.documentDirectory
const IMAGE_DIRECTORY = documentDirectory
  ? `${documentDirectory}ReactNativeApp/`
  : null;

async function ensureImageDirectoryExists() {
  if (!IMAGE_DIRECTORY) {
    throw new Error("Local image directory is not available on this platform.");
  }

  const info = await FileSystem.getInfoAsync(IMAGE_DIRECTORY);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_DIRECTORY, {
      intermediates: true,
    });
  }
}

async function savePhotoToInternalStorage(asset) {
  if (!asset?.uri) {
    throw new Error("Invalid photo asset provided.");
  }

  const timestamp = Date.now();
  const originalName = typeof asset.fileName === "string" ? asset.fileName : "";
  const trimmedName = originalName.trim();
  const nameWithoutExtension = trimmedName
    ? trimmedName.replace(/\.[^/.]+$/, "")
    : `image_${timestamp}`;
  const sanitizedBase = nameWithoutExtension.replace(/[^a-zA-Z0-9_-]/g, "_") || `image_${timestamp}`;

  const extensionMatch = trimmedName.match(/\.([a-zA-Z0-9]+)$/);
  const extension = extensionMatch ? extensionMatch[1] : "jpg";

  const fileName = `${sanitizedBase}_${timestamp}.${extension}`;

  if (!IMAGE_DIRECTORY) {
    console.warn(
      "Document directory unavailable; using temporary cache path for image storage."
    );
    return { fileName, filePath: asset.uri, isTemporary: true };
  }

  await ensureImageDirectoryExists();

  const destinationUri = `${IMAGE_DIRECTORY}${fileName}`;

  try {
    const existing = await FileSystem.getInfoAsync(destinationUri);
    if (existing.exists) {
      await FileSystem.deleteAsync(destinationUri, { idempotent: true });
    }

    await FileSystem.copyAsync({ from: asset.uri, to: destinationUri });
  } catch (err) {
    console.error("Failed to save photo locally", err);
    throw new Error("Unable to save the selected photo locally.");
  }

  return { fileName, filePath: destinationUri };
}

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
  const [fields, setFields] = useState([]);
  const [recordFieldId, setRecordFieldId] = useState("");
  const [recordFieldType, setRecordFieldType] = useState("");
  const [isFieldMenuOpen, setIsFieldMenuOpen] = useState(false);
  const [recordNote, setRecordNote] = useState("");
  const [recordError, setRecordError] = useState("");
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [recordLocation, setRecordLocation] = useState(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [recordPhoto, setRecordPhoto] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [isSelectingPhoto, setIsSelectingPhoto] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);

  const FIELD_TYPE_OPTIONS = [
    "Single Line Text",
    "Multi Line Text",
    "Dropdown",
    "Location",
    "Image/Photo",
  ];

  useEffect(() => {
    if (recordFieldType !== "Location") {
      setRecordLocation(null);
      setIsRequestingLocation(false);
      setLocationError("");
    }
    if (recordFieldType !== "Image/Photo") {
      setRecordPhoto(null);
      setPhotoError("");
      setIsSelectingPhoto(false);
      setIsCapturingPhoto(false);
    }
  }, [recordFieldType]);

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
      setLocationError("");
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
        setPhotoError("");
      }
    } catch (err) {
      console.error("Failed to select photo", err);
      setPhotoError("Unable to pick a photo. Please try again.");
    } finally {
      setIsSelectingPhoto(false);
    }
  };

  const handleCapturePhotoPress = async () => {
    if (isCapturingPhoto) {
      return;
    }

    try {
      setIsCapturingPhoto(true);
      setPhotoError("");

      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        setPhotoError("Camera permission is required to take a photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        setRecordPhoto(result.assets[0]);
        setPhotoError("");
      }
    } catch (err) {
      console.error("Failed to capture photo", err);
      setPhotoError("Unable to capture a photo. Please try again.");
    } finally {
      setIsCapturingPhoto(false);
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

  useEffect(() => {
    if (!Array.isArray(fields) || fields.length === 0) {
      setRecordFieldId("");
      setRecordFieldType("");
      setIsFieldMenuOpen(false);
      return;
    }

    const hasSelectedField = fields.some(
      (field) => String(field?.id) === String(recordFieldId)
    );

    if (!hasSelectedField) {
      const [firstField] = fields;
      if (firstField) {
        setRecordFieldId(String(firstField.id));
        setRecordFieldType(firstField.field_type ?? "");
        setRecordNote("");
        setRecordError("");
      }
    }
  }, [fields, recordFieldId]);

  useEffect(() => {
    if (!recordFieldId) {
      setRecordFieldType("");
      return;
    }

    const nextField = fields.find(
      (field) => String(field?.id) === String(recordFieldId)
    );

    setRecordFieldType(nextField?.field_type ?? "");
  }, [recordFieldId, fields]);

  const selectedRecordField = fields.find(
    (field) => String(field?.id) === String(recordFieldId)
  );

  const selectedFieldIsNumeric = useMemo(
    () => fieldStoresNumericValues(selectedRecordField),
    [selectedRecordField]
  );

  const recordValueLabel = selectedFieldIsNumeric ? "Value" : "Text";

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
      const fieldWithNumericFlag = createdField
        ? {
            ...createdField,
            is_num:
              createdField.is_num ?? (storesNumericValues ? "yes" : "no"),
          }
        : null;

      if (fieldWithNumericFlag) {
        setFields((prev) => {
          if (prev.length === 0) {
            return [fieldWithNumericFlag];
          }

          const updated = [...prev, fieldWithNumericFlag];
          return updated.sort((a, b) => {
            const aIndex = Number(a?.order_index) || 0;
            const bIndex = Number(b?.order_index) || 0;
            return aIndex - bIndex;
          });
        });
        setRecordFieldId(String(fieldWithNumericFlag.id));
        setRecordFieldType(fieldWithNumericFlag.field_type ?? "");
        setRecordNote("");
        setRecordError("");
        setIsFieldMenuOpen(false);
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

  const handleAddRecord = async () => {
    if (isSavingRecord) {
      return;
    }

    if (!recordFieldId) {
      setRecordError("Please select a field to update.");
      return;
    }

    const selectedField = fields.find(
      (field) => String(field?.id) === String(recordFieldId)
    );

    if (!selectedField) {
      setRecordError("Selected field could not be found.");
      return;
    }

    const trimmedValue = recordNote.trim();
    const isImageField = selectedField.field_type === "Image/Photo";
    const isLocationField = selectedField.field_type === "Location";

    if (!isImageField && !trimmedValue) {
      setRecordError(
        `Please enter a ${selectedFieldIsNumeric ? "value" : "text value"} to add to this field.`
      );
      return;
    }

    if (
      isLocationField &&
      (!recordLocation ||
        typeof recordLocation.latitude !== "number" ||
        typeof recordLocation.longitude !== "number")
    ) {
      setLocationError("Please capture your current location to continue.");
      return;
    }

    if (isImageField && !recordPhoto) {
      setPhotoError("Please select a photo to continue.");
      return;
    }

    try {
      setIsSavingRecord(true);
      setRecordError("");

      let parsedOptions = {};
      const rawOptions = selectedField.options;

      if (typeof rawOptions === "string" && rawOptions.trim()) {
        try {
          parsedOptions = JSON.parse(rawOptions);
        } catch (err) {
          console.warn("Unable to parse existing field options", err);
          parsedOptions = {};
        }
      } else if (rawOptions && typeof rawOptions === "object") {
        parsedOptions = { ...rawOptions };
      }

      const fieldKey = selectedField.name?.trim() || "field";
      const existingOptions = Array.isArray(parsedOptions[fieldKey])
        ? [...parsedOptions[fieldKey]]
        : [];

      let valueToStore = trimmedValue;

      if (isLocationField && recordLocation) {
        valueToStore = {
          value: trimmedValue,
          latitude: recordLocation.latitude,
          longitude: recordLocation.longitude,
        };
      } else if (isImageField && recordPhoto) {
        const savedPhoto = await savePhotoToInternalStorage(recordPhoto);
        valueToStore = {
          type: "image",
          value: trimmedValue,
          fileName: savedPhoto.fileName,
          filePath: savedPhoto.filePath,
        };
      }

      existingOptions.push(valueToStore);

      const nextOptions = {
        ...parsedOptions,
        [fieldKey]: existingOptions,
      };

      const payload = {
        options: JSON.stringify(nextOptions),
      };

      const response = await updateField(selectedField.id, payload);
      const updatedField = Array.isArray(response) ? response[0] : response;

      setFields((prev) =>
        prev.map((field) => {
          if (String(field?.id) !== String(selectedField.id)) {
            return field;
          }

          if (updatedField) {
            return { ...field, ...updatedField };
          }

          return { ...field, options: payload.options };
        })
      );

      setRecordNote("");
      setRecordError("");

      if (selectedField.field_type === "Location") {
        setRecordLocation(null);
        setLocationError("");
      }

      if (selectedField.field_type === "Image/Photo") {
        setRecordPhoto(null);
        setPhotoError("");
      }
    } catch (err) {
      console.error("Failed to update field options", err);
      if (isImageField) {
        setPhotoError(
          err?.message ?? "Unable to save the selected photo. Please try again."
        );
      }
      Alert.alert(
        "Error",
        "Unable to add the record right now. Please try again later."
      );
    } finally {
      setIsSavingRecord(false);
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
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Field</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (fields.length > 0) {
                  setIsFieldMenuOpen((prev) => !prev);
                }
              }}
              style={styles.dropdownMock}
              accessibilityRole="button"
              accessibilityLabel="Field"
              disabled={fields.length === 0}
            >
              <Text style={styles.dropdownText}>
                {selectedRecordField?.name
                  ? selectedRecordField.name
                  : fields.length === 0
                  ? "No fields available"
                  : "Select a field"}
              </Text>
              <Ionicons
                name={isFieldMenuOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color="#1E293B"
              />
            </TouchableOpacity>
            {isFieldMenuOpen ? (
              <View style={styles.dropdownList}>
                {fields.map((field) => {
                  const selected =
                    String(field?.id) === String(selectedRecordField?.id);
                  return (
                    <TouchableOpacity
                      key={field.id}
                      onPress={() => {
                        setRecordFieldId(String(field.id));
                        setRecordFieldType(field.field_type ?? "");
                        setIsFieldMenuOpen(false);
                        setRecordNote("");
                        setRecordError("");
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
                        {field.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
          <View style={styles.noteField}>
            <Text style={styles.fieldLabel}>{`${recordValueLabel} *`}</Text>
            {recordFieldType === "Location" ? (
              <TextInput
                style={[styles.recordInput, styles.recordInputMultiline]}
                placeholder={
                  selectedFieldIsNumeric
                    ? "Enter a value"
                    : "Enter a caption (optional)"
                }
                placeholderTextColor="#94A3B8"
                value={recordNote}
                onChangeText={(value) => {
                  setRecordNote(value);
                  if (recordError && value.trim()) {
                    setRecordError("");
                  }
                }}
                multiline
              />
            ) : recordFieldType === "Single Line Text" ? (
              <TextInput
                style={[styles.recordInput, styles.recordInputSingleLine]}
                placeholder={`Enter a ${
                  selectedFieldIsNumeric ? "value" : "text value"
                }`}
                placeholderTextColor="#94A3B8"
                value={recordNote}
                onChangeText={(value) => {
                  setRecordNote(value);
                  if (recordError && value.trim()) {
                    setRecordError("");
                  }
                }}
                multiline={false}
                keyboardType={selectedFieldIsNumeric ? "numeric" : "default"}
              />
            ) : recordFieldType === "Multi Line Text" ? (
              <TextInput
                style={[styles.recordInput, styles.recordInputMultiline]}
                placeholder={`Enter a ${
                  selectedFieldIsNumeric ? "value" : "text value"
                }`}
                placeholderTextColor="#94A3B8"
                value={recordNote}
                onChangeText={(value) => {
                  setRecordNote(value);
                  if (recordError && value.trim()) {
                    setRecordError("");
                  }
                }}
                multiline
                keyboardType={selectedFieldIsNumeric ? "numeric" : "default"}
                numberOfLines={4}
                textAlignVertical="top"
              />
            ) : recordFieldType === "Image/Photo" ? (
              <TextInput
                style={[styles.recordInput, styles.recordInputSingleLine]}
                placeholder={`Enter a ${
                  selectedFieldIsNumeric ? "value" : "text value"
                }`}
                placeholderTextColor="#94A3B8"
                value={recordNote}
                onChangeText={(value) => {
                  setRecordNote(value);
                  if (recordError && value.trim()) {
                    setRecordError("");
                  }
                }}
                multiline={false}
                keyboardType={selectedFieldIsNumeric ? "numeric" : "default"}
              />
            ) : (
              <View style={styles.fieldInputPlaceholder} />
            )}
            {recordError ? (
              <Text style={styles.fieldErrorText}>{recordError}</Text>
            ) : null}
          </View>
          {recordFieldType === "Location" ? (
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
          ) : recordFieldType === "Image/Photo" ? (
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
                <Text style={styles.photoButtonText}>Photo</Text>
                {isSelectingPhoto ? (
                  <ActivityIndicator size="small" color={colors.blue} />
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoButton, styles.cameraButton]}
                accessibilityRole="button"
                onPress={handleCapturePhotoPress}
                disabled={isCapturingPhoto}
              >
                <Ionicons
                  name="camera-outline"
                  size={18}
                  color={colors.blue}
                  style={styles.cameraIcon}
                />
                <Text style={styles.photoButtonText}>Camera</Text>
                {isCapturingPhoto ? (
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
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (isSavingRecord || !recordFieldId) && styles.primaryButtonDisabled,
            ]}
            accessibilityRole="button"
            onPress={handleAddRecord}
            disabled={isSavingRecord || !recordFieldId}
          >
            {isSavingRecord ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons
                  name="add"
                  size={18}
                  color={colors.white}
                  style={styles.primaryIcon}
                />
                <Text style={styles.primaryButtonText}>Add Record</Text>
              </>
            )}
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
  cameraButton: {
    marginTop: 4,
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
  cameraIcon: {
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