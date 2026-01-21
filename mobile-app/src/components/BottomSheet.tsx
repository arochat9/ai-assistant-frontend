import React, { useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Modal, Pressable, Animated } from "react-native";
import { colors, spacing, fontSize } from "../theme";

interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
    const sheetTranslateY = useRef(new Animated.Value(400)).current;

    useEffect(() => {
        if (visible) {
            sheetTranslateY.setValue(400);
            Animated.spring(sheetTranslateY, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                stiffness: 200,
            }).start();
        }
    }, [visible, sheetTranslateY]);

    const handleClose = useCallback(() => {
        Animated.timing(sheetTranslateY, {
            toValue: 400,
            duration: 200,
            useNativeDriver: true,
        }).start(() => onClose());
    }, [sheetTranslateY, onClose]);

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={handleClose} />
                <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
                    <View style={styles.handle} />
                    {title && (
                        <>
                            <Text style={styles.title} numberOfLines={2}>{title}</Text>
                            <View style={styles.divider} />
                        </>
                    )}
                    {children}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    sheet: {
        position: "absolute",
        bottom: -50,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: spacing.xxl + 50,
        paddingHorizontal: spacing.lg,
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: "center",
        marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: fontSize.lg,
        fontWeight: "600",
        color: colors.text,
        marginBottom: spacing.sm,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginBottom: spacing.md,
    },
});
