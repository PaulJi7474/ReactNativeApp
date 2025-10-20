import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function RecordsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Records</Text>
        <Text style={styles.subtitle}>
          Keep track of submitted entries for your form here.
        </Text>
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
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
  },
});