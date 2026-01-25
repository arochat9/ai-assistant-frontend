import React, { useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Modal, Animated, PanResponder } from "react-native";
import { colors, spacing, fontSize } from "../theme";

interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
    const sheetTranslateY = useRef(new Animated.Value(400)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    sheetTranslateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 0.5) {
                    handleClose();
                } else {
                    Animated.spring(sheetTranslateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        damping: 20,
                        stiffness: 200,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            sheetTranslateY.setValue(400);
            backdropOpacity.setValue(0);
            Animated.parallel([
                Animated.spring(sheetTranslateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 200,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, sheetTranslateY, backdropOpacity]);

    const handleClose = useCallback(() => {
        Animated.parallel([
            Animated.timing(sheetTranslateY, {
                toValue: 400,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => onClose());
    }, [sheetTranslateY, backdropOpacity, onClose]);

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
                    <View style={styles.backdropTouchable} onTouchEnd={handleClose} />
                </Animated.View>
                <Animated.View 
                    style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}
                    {...panResponder.panHandlers}
                >
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
    backdropTouchable: {
        flex: 1,
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
