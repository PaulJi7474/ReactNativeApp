import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";
import MapView, { Circle } from "react-native-maps";

const DEFAULT_REGION = {
  latitude: -27.4698,
  longitude: 153.0251,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);

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

  const isSearching = hasPermission === true && !userLocation && isLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
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
        </MapView>

        <View style={styles.statusContainer} pointerEvents="none">
          {isLoading && !isSearching && (
            <View style={styles.statusRow}>
              <ActivityIndicator color="#0A6DFF" />
              <Text style={styles.statusText}>Preparing map…</Text>
            </View>
          )}

          {isSearching && (
            <View style={styles.statusRow}>
              <ActivityIndicator color="#0A6DFF" />
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
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    color: "#E2E8F0",
    fontSize: 15,
  },
  errorText: {
    color: "#F87171",
    fontWeight: "600",
  },
  detailsContainer: {
    gap: 4,
  },
  detailsTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  detailsSubtitle: {
    color: "#BFDBFE",
    fontSize: 14,
  },
  detailsAccuracy: {
    color: "#94A3B8",
    fontSize: 13,
  },
});