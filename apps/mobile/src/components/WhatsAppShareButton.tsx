import React from "react";
import { Linking, Alert } from "react-native";
import { Button } from "./ui/Button";
import { triggerHaptic } from "../utils/haptics";
import { Ionicons } from "@expo/vector-icons";
import { formatPhoneForWhatsApp, buildWhatsAppShareUrl } from "@serrucho/core";

interface WhatsAppShareButtonProps {
  phone?: string | null;
  message: string;
  title?: string;
  size?: "sm" | "md" | "lg";
}

export const WhatsAppShareButton: React.FC<WhatsAppShareButtonProps> = ({
  phone,
  message,
  title = "Cobrar por WhatsApp",
  size = "sm",
}) => {
  const handleOpenWhatsApp = async () => {
    triggerHaptic("medium");

    const cleanPhone = formatPhoneForWhatsApp(phone);
    const encodedText = encodeURIComponent(message);
    const nativeUrl = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
      : `whatsapp://send?text=${encodedText}`;

    const webFallback = buildWhatsAppShareUrl(message, cleanPhone);

    try {
      const canOpen = await Linking.canOpenURL(nativeUrl);
      if (canOpen) {
        await Linking.openURL(nativeUrl);
      } else {
        await Linking.openURL(webFallback);
      }
    } catch {
      Alert.alert(
        "WhatsApp no disponible",
        "No pudimos abrir WhatsApp directamente en este dispositivo."
      );
    }
  };

  return (
    <Button
      title={title}
      onPress={handleOpenWhatsApp}
      variant="secondary"
      size={size}
      icon={<Ionicons name="logo-whatsapp" size={16} color="#ffffff" />}
    />
  );
};
