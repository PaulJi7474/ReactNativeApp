import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors, radii, sharedStyles, spacing } from "../../style/style";
import { USERNAME, fetchFieldsByFormId } from "../app";

function normaliseFieldValues(field) {
  if (!field) {
    return { values: [], fieldName: "", fieldType: "", username: "" };
  }

  const { name, field_type: fieldType, username, options } = field;
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
    const valueText = typeof value.value === "string" ? value.value : "";

    const coordinates = [];
    if (typeof value.latitude === "number") {
      coordinates.push(`Lat: ${value.latitude.toFixed(5)}`);
    }
    if (typeof value.longitude === "number") {
      coordinates.push(`Lng: ${value.longitude.toFixed(5)}`);
    }

    if (valueText && coordinates.length) {
      return `${valueText} (${coordinates.join(", ")})`;
    }

    if (coordinates.length) {
      return coordinates.join(", ");
    }

    if (valueText) {
      return valueText;
    }

    try {
      return JSON.stringify(value);
    } catch (_err) {
      return String(value);
    }
  }

  return String(value);
}

function buildRecordEntries(fields) {
  if (!Array.isArray(fields) || fields.length === 0) {
    return [];
  }

  const normalised = fields.map(normaliseFieldValues);
  const maxLength = normalised.reduce(
    (largest, field) => Math.max(largest, field.values.length),
    0
  );

  if (maxLength === 0) {
    return [];
  }

  const derivedUsername =
    normalised.find((item) => item.username)?.username || USERNAME || "";

  const records = [];

  for (let index = 0; index < maxLength; index += 1) {
    const entries = normalised
      .map(({ fieldName, fieldType, values }) => {
        if (index >= values.length) {
          return null;
        }

        const value = values[index];
        if (value === undefined || value === null || value === "") {
          return null;
        }

        return {
          fieldName,
          fieldType,
          value: formatFieldValue(value),
        };
      })
      .filter(Boolean);

    if (entries.length > 0) {
      records.push({ id: index, entries, username: derivedUsername });
    }
  }

  return records;
}

export default function RecordsScreen() {
  const { formId: formIdParam, formName } = useLocalSearchParams();
  const formId = Array.isArray(formIdParam) ? formIdParam[0] : formIdParam;

  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
  const recordCount = records.length;

  const title = formName
    ? `Records – ${Array.isArray(formName) ? formName[0] : formName}`
    : "Records";

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

        {loading ? (
          <View style={styles.feedbackContainer}>
            <ActivityIndicator color={colors.blue} size="large" />
          </View>
        ) : error ? (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>{error}</Text>
          </View>
        ) : recordCount === 0 ? (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>
              No records have been added to this form yet.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {records.map((record, index) => (
              <View key={record.id ?? index} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordTitle}>Record {index + 1}</Text>
                  {record.username ? (
                    <Text style={styles.recordUsername}>{record.username}</Text>
                  ) : null}
                </View>
                <View style={styles.recordBody}>
                  {record.entries.map((entry) => (
                    <View
                      key={`${entry.fieldName}-${entry.value}`}
                      style={styles.recordField}
                    >
                      <Text style={styles.recordFieldName}>{entry.fieldName}</Text>
                      <Text style={styles.recordFieldValue}>
                        {entry.fieldType ? `${entry.fieldType}: ` : ""}
                        {entry.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
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
    gap: spacing.md,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  recordUsername: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.blue,
  },
  recordBody: {
    gap: spacing.md,
  },
  recordField: {
    backgroundColor: colors.backgroundMuted,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 4,
  },
  recordFieldName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  recordFieldValue: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});