import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
// eslint-disable-next-line import/no-unresolved
import * as Location from "expo-location";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
// eslint-disable-next-line import/no-unresolved
import MapView, { Circle, Marker } from "react-native-maps";
import { colors } from "../../style/style";
import { fetchFieldsByFormId } from "../app";

const DEFAULT_REGION = {
  latitude: -27.4698,
  longitude: 153.0251,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const { formId: formIdParam } = useLocalSearchParams();
  const formId = Array.isArray(formIdParam) ? formIdParam[0] : formIdParam;
  const [hasPermission, setHasPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);
  const [savedLocations, setSavedLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationsError, setLocationsError] = useState("");
  const [locationsMessage, setLocationsMessage] = useState("");

  const extractLocationEntries = useCallback((field) => {
    const rawOptions = field?.options;

    if (!rawOptions) {
      return [];
    }

    let parsedOptions;

    if (typeof rawOptions === "string") {
      try {
        parsedOptions = JSON.parse(rawOptions);
      } catch (error) {
        console.warn("Unable to parse location field options", error);
        return [];
      }
    } else if (typeof rawOptions === "object") {
      parsedOptions = rawOptions;
    } else {
      return [];
    }

    const optionGroups = Array.isArray(parsedOptions)
      ? [parsedOptions]
      : Object.values(parsedOptions ?? {});

    return optionGroups
      .flatMap((group) => (Array.isArray(group) ? group : []))
      .filter(
        (entry) =>
          entry &&
          typeof entry.latitude === "number" &&
          typeof entry.longitude === "number"
      )
      .map((entry, index) => ({
        id: `${field.id}-${index}`,
        latitude: entry.latitude,
        longitude: entry.longitude,
        label:
          typeof entry.value === "string" && entry.value.trim()
            ? entry.value.trim()
            : field.name || `Location ${index + 1}`,
        note: entry.value,
      }));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      let locationSubscription = null;

      async function requestAndWatchLocation() {
        setIsLoading(true);
        setErrorMessage(null);
        setUserLocation(null);

        try {
          const { status } = await Location.requestForegroundPermissionsAsync();

          if (!isActive) {
            return;
          }

          if (status !== "granted") {
            setHasPermission(false);
            setErrorMessage("Location permission is required to show the map.");
            return;
          }

          setHasPermission(true);

          const currentPosition = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          if (!isActive) {
            return;
          }

          const { latitude, longitude, accuracy } = currentPosition.coords;
          setUserLocation({ latitude, longitude, accuracy });

          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              distanceInterval: 10,
            },
            (location) => {
              if (!isActive) {
                return;
              }

              const { latitude: lat, longitude: lng, accuracy: positionAccuracy } =
                location.coords;
              setUserLocation({ latitude: lat, longitude: lng, accuracy: positionAccuracy });
            }
          );
        } catch (error) {
          if (isActive) {
            setErrorMessage("Unable to access your location. Please try again.");
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      requestAndWatchLocation();

      return () => {
        isActive = false;
        if (locationSubscription) {
          locationSubscription.remove();
        }
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadLocations = async () => {
        if (!formId) {
          if (isActive) {
            setSavedLocations([]);
            setLocationsError("");
            setLocationsMessage("Select a form to view saved locations.");
          }
          return;
        }

        try {
          if (isActive) {
            setIsLoadingLocations(true);
            setLocationsError("");
            setLocationsMessage("");
          }

          const data = await fetchFieldsByFormId(formId);

          if (!isActive) {
            return;
          }

          const fields = Array.isArray(data) ? data : data ? [data] : [];
          const locationEntries = fields
            .filter((field) => field?.field_type === "Location")
            .flatMap((field) => extractLocationEntries(field));

          setSavedLocations(locationEntries);

          if (locationEntries.length === 0) {
            setLocationsMessage("No saved locations found for this form yet.");
          } else {
            setLocationsMessage("");
          }
        } catch (error) {
          console.error("Failed to load locations", error);
          if (isActive) {
            setSavedLocations([]);
            setLocationsError(
              "Unable to load saved locations right now. Please try again later."
            );
          }
        } finally {
          if (isActive) {
            setIsLoadingLocations(false);
          }
        }
      };

      loadLocations();

      return () => {
        isActive = false;
      };
    }, [extractLocationEntries, formId])
  );

  useEffect(() => {
    if (userLocation) {
      setMapRegion((previousRegion) => ({
        ...previousRegion,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }));
    }
  }, [userLocation]);

  useEffect(() => {
    if (!userLocation && savedLocations.length > 0) {
      const [firstLocation] = savedLocations;
      setMapRegion((previousRegion) => ({
        ...previousRegion,
        latitude: firstLocation.latitude,
        longitude: firstLocation.longitude,
        latitudeDelta: previousRegion.latitudeDelta ?? 0.05,
        longitudeDelta: previousRegion.longitudeDelta ?? 0.05,
      }));
    }
  }, [savedLocations, userLocation]);

  const isSearching = hasPermission === true && !userLocation && isLoading;

  return (
    <SafeAreaProvider style={styles.safeArea}>
      <View style={styles.container}>
        <MapView
          style={styles.map}
          region={mapRegion}
          showsUserLocation={hasPermission === true}
          showsMyLocationButton={hasPermission === true}
        >
          {userLocation && (
            <Circle
              center={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              radius={100}
              strokeWidth={2}
              strokeColor="rgba(33, 150, 243, 0.8)"
              fillColor="rgba(33, 150, 243, 0.15)"
            />
          )}
          {savedLocations.map((location) => (
            <Marker
              key={location.id}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={location.label}
              description={
                typeof location.note === "string" ? location.note : undefined
              }
            />
          ))}
        </MapView>

        <View style={styles.statusContainer} pointerEvents="none">
          {isLoading && !isSearching && (
            <View style={styles.statusRow}>
              <ActivityIndicator color="colors.blue" />
              <Text style={styles.statusText}>Preparing map…</Text>
            </View>
          )}

          {isSearching && (
            <View style={styles.statusRow}>
              <ActivityIndicator color="colors.blue" />
              <Text style={styles.statusText}>Searching for your location…</Text>
            </View>
          )}

          {errorMessage && !isLoading && (
            <Text style={[styles.statusText, styles.errorText]}>{errorMessage}</Text>
          )}

          {userLocation && !isLoading && !errorMessage && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>You&apos;re here</Text>
              <Text style={styles.detailsSubtitle}>
                Lat {userLocation.latitude.toFixed(5)} · Long {userLocation.longitude.toFixed(5)}
              </Text>
              {typeof userLocation.accuracy === "number" && (
                <Text style={styles.detailsAccuracy}>
                  Accuracy ±{Math.round(userLocation.accuracy)} metres
                </Text>
              )}
            </View>
          )}

          {isLoadingLocations && (
            <View style={styles.statusRow}>
              <ActivityIndicator color="colors.blue" />
              <Text style={styles.statusText}>Loading saved locations…</Text>
            </View>
          )}

          {!isLoadingLocations && locationsError && (
            <Text style={[styles.statusText, styles.errorText]}>{locationsError}</Text>
          )}

          {!isLoadingLocations && !locationsError && locationsMessage && (
            <Text style={styles.statusText}>{locationsMessage}</Text>
          )}

          {/* {!isLoadingLocations && !locationsError && !locationsMessage && savedLocations.length > 0 && (
            <Text style={styles.statusText}>
              {savedLocations.length === 1
                ? "Showing 1 saved location"
                : `Showing ${savedLocations.length} saved locations`}
            </Text>
          )} */}
        </View>
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
  },
  map: {
    flex: 1,
  },
  statusContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 24,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    gap: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusText: {
    color: colors.white,
    fontSize: 15,
  },
  errorText: {
    color: colors.pink,
    fontWeight: "600",
  },
  detailsContainer: {
    gap: 4,
  },
  detailsTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  detailsSubtitle: {
    color: colors.lightBlue,
    fontSize: 14,
  },
  detailsAccuracy: {
    color: colors.gray,
    fontSize: 13,
  },
});