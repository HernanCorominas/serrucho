import React from "react";
import { Linking, Alert } from "react-native";
import { Button } from "./ui/Button";
import { triggerHaptic } from "../utils/haptics";
import { Ionicons } from "@expo/vector-icons";

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
    
    // Clean phone number (Dominican format or international)
    let cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";
    if (cleanPhone.length === 10 && (cleanPhone.startsWith("809") || cleanPhone.startsWith("829") || cleanPhone.startsWith("849"))) {
      cleanPhone = `1${cleanPhone}`;
    }

    const encodedText = encodeURIComponent(message);
    const url = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
      : `whatsapp://send?text=${encodedText}`;

    const webFallback = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
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
