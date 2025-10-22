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
    backgroundColor: "colors.white",
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
    color: "colors.textPrimary",
  },
  subtitle: {
    fontSize: 15,
    color: "colors.Secondary",
    textAlign: "center",
    lineHeight: 22,
  },
});