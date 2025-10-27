import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// eslint-disable-next-line import/no-unresolved
import * as Clipboard from "expo-clipboard";
import { colors, radii, sharedStyles, spacing } from "../../style/style";

import { USERNAME, fetchFieldsByFormId, updateField } from "../app";

function normaliseFieldValues(field) {
  if (!field) {
    return {
      values: [],
      fieldId: null,
      fieldName: "",
      fieldType: "",
      username: "",
    };
  }

  const { id: fieldId, name, field_type: fieldType, username, options } = field;
  let parsedOptions = {};

  if (typeof options === "string" && options.trim()) {
    try {
      parsedOptions = JSON.parse(options);
    } catch (err) {
      console.warn("Unable to parse field options", err);
      parsedOptions = {};
    }
  } else if (options && typeof options === "object") {
    parsedOptions = options;
  }

  const fallbackKey = name?.trim() || "field";
  let values = parsedOptions?.[fallbackKey];

  if (!Array.isArray(values)) {
    const firstArray = Object.values(parsedOptions || {}).find((value) =>
      Array.isArray(value)
    );
    values = Array.isArray(firstArray) ? firstArray : [];
  }

  return {
    values,
    fieldId: fieldId ?? null,
    fieldName: name || "Field",
    fieldType: fieldType || "",
    username: username || "",
  };
}

function formatFieldValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    const caption = typeof value.value === "string" ? value.value : "";

    if (
      value.type === "image" ||
      (typeof value.filePath === "string" && value.filePath) ||
      (typeof value.fileName === "string" && value.fileName)
    ) {
      if (typeof value.fileName === "string" && value.fileName.trim()) {
        return value.fileName.trim();
      }

      if (typeof value.filePath === "string" && value.filePath.trim()) {
        return value.filePath.trim();
      }

      if (caption.trim()) {
        return caption.trim();
      }

      return "Image";
    }

    const coordinates = [];
    if (typeof value.latitude === "number") {
      coordinates.push(`Lat: ${value.latitude.toFixed(5)}`);
    }
    if (typeof value.longitude === "number") {
      coordinates.push(`Lng: ${value.longitude.toFixed(5)}`);
    }

    if (caption && coordinates.length) {
      return `${caption} (${coordinates.join(", ")})`;
    }

    if (coordinates.length) {
      return coordinates.join(", ");
    }

    if (caption) {
      return caption;
    }

    try {
      return JSON.stringify(value);
    } catch (_err) {
      return String(value);
    }
  }

  return String(value);
}

function getRecordIdentifierFromValue(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const possibleKeys = ["record_id", "recordId", "id"];

  for (const key of possibleKeys) {
    const candidate = value[key];
    if (candidate !== undefined && candidate !== null) {
      const text = String(candidate).trim();
      if (text) {
        return text;
      }
    }
  }

  return null;
}

function buildRecordEntries(fields) {
  if (!Array.isArray(fields) || fields.length === 0) {
    return [];
  }

  const normalised = fields.map(normaliseFieldValues);
  const derivedUsername =
    normalised.find((item) => item.username)?.username || USERNAME || "";

  const records = [];

  normalised.forEach(
    ({ fieldId, fieldName, fieldType, username, values }, fieldIndex) => {
      values.forEach((rawValue, valueIndex) => {
        if (rawValue === undefined || rawValue === null || rawValue === "") {
          return;
        }

        const formattedValue = formatFieldValue(rawValue);
        if (!formattedValue && formattedValue !== "0") {
          return;
        }

        const recordId = getRecordIdentifierFromValue(rawValue);
        const keyParts = [
          fieldId !== undefined && fieldId !== null
            ? `field-${fieldId}`
            : `fieldIndex-${fieldIndex}`,
          `value-${valueIndex}`,
        ];

        if (recordId) {
          keyParts.push(`record-${recordId}`);
        }

        records.push({
          id: keyParts.join("-"),
          fieldId: fieldId ?? null,
          fieldName,
          fieldType,
          recordId: recordId || null,
          username: username || derivedUsername,
          value: formattedValue,
          rawValue,
          valueIndex,
        });
      });
    }
  );

  return records;
}

function parseFieldOptions(rawOptions) {
  if (typeof rawOptions === "string" && rawOptions.trim()) {
    try {
      return JSON.parse(rawOptions);
    } catch (err) {
      console.warn("Unable to parse field options", err);
      return {};
    }
  }

  if (rawOptions && typeof rawOptions === "object") {
    return { ...rawOptions };
  }

  return {};
}

function getEditableFieldValues(field) {
  const optionsObject = parseFieldOptions(field?.options);
  const fallbackKey = field?.name?.trim() || "field";

  let selectedKey = fallbackKey;
  let values = Array.isArray(optionsObject[selectedKey])
    ? [...optionsObject[selectedKey]]
    : null;

  if (!values) {
    const firstEntry = Object.entries(optionsObject).find(([, value]) =>
      Array.isArray(value)
    );

    if (firstEntry) {
      selectedKey = firstEntry[0];
      values = [...firstEntry[1]];
    }
  }

  if (!values) {
    values = [];
  }

  return { optionsObject, selectedKey, values };
}

export default function RecordsScreen() {
  const { formId: formIdParam, formName } = useLocalSearchParams();
  const formId = Array.isArray(formIdParam) ? formIdParam[0] : formIdParam;

  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingRecordId, setDeletingRecordId] = useState(null);
  const [selectedFieldName, setSelectedFieldName] = useState("All");
  const [appliedFieldName, setAppliedFieldName] = useState("All");
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadFields = async () => {
      if (!formId) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await fetchFieldsByFormId(formId);
        if (!isMounted) {
          return;
        }

        if (Array.isArray(data)) {
          setFields(data);
        } else {
          setFields([]);
        }
      } catch (err) {
        console.error("Failed to load fields", err);
        if (isMounted) {
          setError("Unable to load records. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFields();

    return () => {
      isMounted = false;
    };
  }, [formId]);

  const records = useMemo(() => buildRecordEntries(fields), [fields]);

  const fieldNameOptions = useMemo(() => {
    const uniqueNames = new Set();

    records.forEach((record) => {
      if (typeof record.fieldName === "string" && record.fieldName.trim()) {
        uniqueNames.add(record.fieldName);
      }
    });

    const sorted = Array.from(uniqueNames)
      .filter((name) => name !== "All")
      .sort((a, b) => a.localeCompare(b));

    return ["All", ...sorted];
  }, [records]);

  useEffect(() => {
    if (!fieldNameOptions.includes(selectedFieldName)) {
      setSelectedFieldName("All");
    }

    if (!fieldNameOptions.includes(appliedFieldName)) {
      setAppliedFieldName("All");
    }
  }, [fieldNameOptions, selectedFieldName, appliedFieldName]);

  const filteredRecords = useMemo(() => {
    if (appliedFieldName === "All") {
      return records;
    }

    return records.filter((record) => record.fieldName === appliedFieldName);
  }, [records, appliedFieldName]);

  const hasAnyRecords = records.length > 0;
  const recordCount = filteredRecords.length;
  const isApplyDisabled = selectedFieldName === appliedFieldName;

  const handleApplyFilter = () => {
    if (isApplyDisabled) {
      setIsFieldDropdownOpen(false);
      return;
    }

    setAppliedFieldName(selectedFieldName);
    setIsFieldDropdownOpen(false);
  };

  const handleSelectFieldName = (fieldName) => {
    setSelectedFieldName(fieldName);
    setIsFieldDropdownOpen(false);
  };

  const toggleFieldDropdown = () => {
    setIsFieldDropdownOpen((prev) => !prev);
  };

  const title = formName
    ? `Records – ${Array.isArray(formName) ? formName[0] : formName}`
    : "Records";

  const handleCopyRecord = async (record) => {
    try {
      const parts = [];

      if (record?.recordId) {
        parts.push(`Record ID: ${record.recordId}`);
      }

      if (record?.fieldName) {
        parts.push(`Field Name: ${record.fieldName}`);
      }

      if (record?.fieldType) {
        parts.push(`Field Type: ${record.fieldType}`);
      }

      if (record?.username) {
        parts.push(`Username: ${record.username}`);
      }
      if (record?.fieldType === "Image/Photo" && record?.rawValue) {
        if (
          typeof record.rawValue.fileName === "string" &&
          record.rawValue.fileName.trim()
        ) {
          parts.push(`File Name: ${record.rawValue.fileName}`);
        }

        if (
          typeof record.rawValue.filePath === "string" &&
          record.rawValue.filePath.trim()
        ) {
          parts.push(`File Path: ${record.rawValue.filePath}`);
        }

        if (
          typeof record.rawValue.value === "string" &&
          record.rawValue.value.trim()
        ) {
          parts.push(`Caption: ${record.rawValue.value}`);
        }
      } else if (record?.value || record?.value === "0") {
        parts.push(`Value: ${record.value}`);
      }

      const formatted = parts.join("\n");

      await Clipboard.setStringAsync(formatted);
      Alert.alert("Copied", "Record copied to clipboard.");
    } catch (err) {
      console.error("Failed to copy record", err);
      Alert.alert("Error", "We couldn't copy that record. Please try again later.");
    }
  };

  const performDeleteRecord = async (record) => {
    const recordKey = record?.id;

    if (!record || !recordKey) {
      Alert.alert(
        "Error",
        "We couldn't identify that record. Please try again later."
      );
      return;
    }

    if (record.fieldId === null || record.fieldId === undefined) {
      Alert.alert(
        "Error",
        "We couldn't match this record to a field. Please try again later."
      );
      return;
    }

    setDeletingRecordId(recordKey);

    try {
      const field = fields.find(
        (item) => String(item?.id) === String(record.fieldId)
      );

      if (!field) {
        throw new Error("Field not found for the selected record.");
      }

      const { optionsObject, selectedKey, values } =
        getEditableFieldValues(field);

      const valueIndex = record.valueIndex;

      if (typeof valueIndex !== "number" || valueIndex < 0) {
        throw new Error("Invalid index for the selected record.");
      }

      if (valueIndex >= values.length) {
        throw new Error("The record is no longer available.");
      }

      const nextValues = [...values];
      nextValues.splice(valueIndex, 1);

      const nextOptions = {
        ...optionsObject,
        [selectedKey]: nextValues,
      };

      const optionsJson = JSON.stringify(nextOptions);
      const response = await updateField(field.id, { options: optionsJson });
      const updatedField = Array.isArray(response) ? response[0] : response;

      setFields((prev) =>
        prev.map((item) => {
          if (String(item.id) !== String(field.id)) {
            return item;
          }

          if (updatedField && Object.keys(updatedField).length > 0) {
            return { ...item, ...updatedField };
          }

          return { ...item, options: optionsJson };
        })
      );
    } catch (err) {
      console.error("Failed to delete record", err);
      Alert.alert(
        "Error",
        "We couldn't delete that record. Please try again later."
      );
    } finally {
      setDeletingRecordId(null);
    }
  };

  const confirmDeleteRecord = (record) => {
    const descriptor =
      record?.recordId || record?.fieldName || "this record";

    Alert.alert(
      "Delete Record",
      `Are you sure you want to delete ${descriptor}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => performDeleteRecord(record),
        },
      ]
    );
  };

  return (
    <SafeAreaProvider style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {recordCount > 0 ? (
            <Text style={styles.subtitle}>
              {recordCount} {recordCount === 1 ? "record" : "records"} found
            </Text>
          ) : null}
        </View>

        <View style={styles.filterCard}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Field Name</Text>
            <View style={styles.dropdownWrapper}>
              <Pressable
                accessibilityLabel="Select a field name to filter by"
                accessibilityRole="button"
                onPress={toggleFieldDropdown}
                style={({ pressed }) => [
                  styles.dropdownButton,
                  pressed && styles.dropdownButtonPressed,
                ]}
              >
                <Text style={styles.dropdownButtonText} numberOfLines={1}>
                  {selectedFieldName}
                </Text>
                <Text style={styles.dropdownCaret}>
                  ▾
                </Text>
              </Pressable>

              {isFieldDropdownOpen ? (
                <View style={styles.dropdownMenu}>
                  {fieldNameOptions.map((option) => {
                    const isSelected = option === selectedFieldName;

                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="button"
                        onPress={() => handleSelectFieldName(option)}
                        style={({ pressed }) => [
                          styles.dropdownOption,
                          pressed && styles.dropdownOptionPressed,
                          isSelected && styles.dropdownOptionSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            isSelected && styles.dropdownOptionSelectedText,
                          ]}
                          numberOfLines={1}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>

          <Pressable
            accessibilityHint="Applies the selected field name filter"
            accessibilityRole="button"
            accessibilityState={{ disabled: isApplyDisabled }}
            disabled={isApplyDisabled}
            onPress={handleApplyFilter}
            style={({ pressed }) => [
              styles.applyButton,
              pressed && !isApplyDisabled && styles.applyButtonPressed,
              isApplyDisabled && styles.applyButtonDisabled,
            ]}
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.feedbackContainer}>
            <ActivityIndicator color={colors.blue} size="large" />
          </View>
        ) : error ? (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>{error}</Text>
          </View>
        ) : !hasAnyRecords ? (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>
              No records have been added to this form yet.
            </Text>
          </View>
        ) : recordCount === 0 ? (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>
              No records match the selected field.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredRecords.map((record, index) => {
              const isImageRecord = record.fieldType === "Image/Photo";
              const hasImagePath =
                isImageRecord &&
                record.rawValue &&
                typeof record.rawValue.filePath === "string" &&
                record.rawValue.filePath.trim();

              return (
                <View key={record.id ?? index} style={styles.recordCard}>
                  <Text style={styles.line} numberOfLines={1} ellipsizeMode="middle">
                    <Text style={styles.textInCardBold}>Name: </Text>

                    {record.fieldName ? (
                      <Text style={styles.recordFieldValue}>{record.fieldName}</Text>
                    ) : null}
                  </Text>

                  {(() => {
                    if (!record) {
                      return null;
                    }

                    const hasImageText =
                      isImageRecord &&
                      record.rawValue &&
                      typeof record.rawValue.value === "string" &&
                      record.rawValue.value.trim();

                    if (hasImageText) {
                      return (
                        <Text
                          style={styles.line}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          <Text style={styles.textInCardBold}>Text: </Text>
                          <Text style={styles.recordFieldValue}>
                            {record.rawValue.value}
                          </Text>
                        </Text>
                      );
                    }

                    if (record.value || record.value === "0") {
                      return (
                        <Text
                          style={styles.line}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          <Text style={styles.textInCardBold}>Value: </Text>
                          <Text style={styles.recordFieldValue}>{record.value}</Text>
                        </Text>
                      );
                    }

                    return null;
                  })()}

                  {hasImagePath ? (
                    <Image
                      source={{ uri: record.rawValue.filePath }}
                      style={styles.recordImage}
                      accessibilityLabel={
                        record.rawValue.fileName || "Submitted image"
                      }
                    />
                  ) : null}

                  <Text style={styles.line} numberOfLines={1} ellipsizeMode="middle">
                    <Text style={styles.textInCardBold}>Publisher: </Text>
                    {record.username ? (
                      <Text style={styles.recordFieldValue}>{record.username}</Text>
                    ) : null}
                  </Text>

                  <View style={styles.recordActions}>
                    <Pressable
                      accessibilityHint="Copies the record details to the clipboard"
                      onPress={() => handleCopyRecord(record)}
                      style={styles.copyButton}
                    >
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </Pressable>
                    <Pressable
                      accessibilityHint="Deletes this record"
                      disabled={
                        deletingRecordId === record.id ||
                        record.fieldId === null ||
                        record.fieldId === undefined
                      }
                      onPress={() => confirmDeleteRecord(record)}
                      style={({ pressed }) => [
                        styles.deleteButton,
                        pressed && styles.actionButtonPressed,
                        deletingRecordId === record.id && styles.actionButtonDisabled,
                        (record.fieldId === null || record.fieldId === undefined) &&
                          styles.actionButtonDisabled,
                      ]}
                    >
                      {deletingRecordId === record.id ? (
                        <ActivityIndicator color={colors.red} size="small" />
                      ) : (
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
  },
  contentContainer: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  filterCard: {
    ...sharedStyles.card,
    gap: spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  dropdownWrapper: {
    flex: 1,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  dropdownButtonPressed: {
    opacity: 0.85,
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  dropdownCaret: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  dropdownMenu: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    overflow: "hidden",
    width: "100%",
  },
  dropdownOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  dropdownOptionPressed: {
    backgroundColor: colors.inputMutedBackground,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.lightBlue,
  },
  dropdownOptionText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  dropdownOptionSelectedText: {
    fontWeight: "600",
  },
  applyButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    backgroundColor: colors.blue,
  },
  applyButtonPressed: {
    opacity: 0.85,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  feedbackContainer: {
    ...sharedStyles.card,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  feedbackText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  list: {
    gap: spacing.lg,
  },
  recordCard: {
    ...sharedStyles.card,
    gap: spacing.sm,
  },
  line: {
    flexShrink: 1,
  },
  textInCardBold: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  recordFieldValue: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  recordImage: {
    width: "100%",
    height: 180,
    borderRadius: radii.md,
    marginTop: spacing.xs,
    backgroundColor: colors.inputMutedBackground,
  },
  recordActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  copyButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  copyButtonText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.red,
    borderWidth: 1,
    borderColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
});