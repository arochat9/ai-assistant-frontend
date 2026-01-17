import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { colors, spacing, fontSize } from "../theme";

export function CalendarScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Calendar</Text>
                <Text style={styles.subtitle}>View events and schedules</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.placeholder}>Coming soon...</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: fontSize.xxl,
        fontWeight: "700" as const,
        color: colors.text,
    },
    subtitle: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    content: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    placeholder: {
        fontSize: fontSize.lg,
        color: colors.textMuted,
    },
});
