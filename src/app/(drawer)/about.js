import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Image
          source={require("@/assets/images/forms.png")}
          style={styles.heroImage}
          resizeMode="contain"
        />
        <Text style={styles.heroTitle}>FormBase</Text>
        <Text style={styles.cardItem}>Build, Collect & Explore</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>✨ Features</Text>
        <Text style={styles.cardItem}>• Create forms with a variety of fields</Text>
        <Text style={styles.cardItem}>• Collect records on your phone</Text>
        <Text style={styles.cardItem}>• Search & filter with flexible conditions</Text>
        <Text style={styles.cardItem}>• Visualize location data on a map</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚀 Powered By</Text>
        <Text style={styles.cardItem}>• Expo + React Native</Text>
        <Text style={styles.cardItem}>• PostgREST API backend</Text>
        <Text style={styles.cardItem}>• React Native Maps & Moti animations</Text>
        <Text style={styles.cardItem}>• Modern mobile UI design</Text>
      </View>

      <Text style={styles.footerText}>
        FormBase v0.5 — Made with ❤️ using React Native and Expo!
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
    backgroundColor: "#FFFFFF",
    gap: 24,
  },
  heroCard: {
    alignItems: "center",
    gap: 8,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  heroImage: {
    width: 140,
    height: 140,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#0A6DFF",
    fontWeight: "600",
  },
  card: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardItem: {
    fontSize: 15,
    color: "#334155",
    lineHeight: 22,
  },
  footerText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
});