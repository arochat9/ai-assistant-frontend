import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, spacing, fontSize, borderRadius } from "../theme";

interface BottomSheetOptionProps {
    label: string;
    onPress: () => void;
    selected?: boolean;
}

export function BottomSheetOption({ label, onPress, selected }: BottomSheetOptionProps) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
            ]}
            onPress={onPress}
        >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
            {selected && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    option: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "space-between" as const,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
        marginBottom: spacing.xs,
    },
    optionSelected: {
        backgroundColor: colors.surfaceElevated,
    },
    optionPressed: {
        backgroundColor: colors.surface,
        opacity: 0.7,
    },
    optionText: {
        fontSize: fontSize.md,
        color: colors.text,
    },
    optionTextSelected: {
        fontWeight: "500" as const,
    },
    checkmark: {
        fontSize: fontSize.md,
        color: colors.primary,
        fontWeight: "600" as const,
    },
});
