export const colors = {
  backgroundMuted: "#F8FAFC",
  white: "#FFFFFF", //surface
  blue: "#0A6DFF", //primary
  primaryText: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  inputBorder: "#CBD5F5",
  border: "#E2E8F0",
  inputMutedBackground: "#F8FAFF",
  destructiveBackground: "#FEE2E2",
  destructiveBorder: "#FECACA",
  red: "#B91C1C", //destructiveText
  lightRed: "#ca2929ff",
  lightBlue: "#BFDBFE",
  gray: "#94A3B8",
  pink: "#EC4899",
  shadow: "#1E293B",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  pill: 999,
};

export const sharedStyles = {
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blue,
    borderRadius: radii.pill,
    paddingVertical: 14,
    gap: 6,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: "600",
  },
  primaryIcon: {
    marginRight: 2,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.blue,
    borderWidth: 1.5,
    borderRadius: radii.pill,
    paddingVertical: 12,
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.blue,
  },
  secondaryIcon: {
    marginRight: 2,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.destructiveBackground,
  },
  cancelButtonText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: "600",
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  backLinkText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: "500",
  },
};