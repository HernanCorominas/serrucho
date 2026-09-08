import React from "react";
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { semanticTokens } from "@serrucho/ui";
import { DSText } from "./DSText";

export type DSAvatarSize = "sm" | "md" | "lg";

export interface DSAvatarProps {
  name?: string;
  imageUri?: string | null;
  size?: DSAvatarSize;
  onEdit?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const DSAvatar: React.FC<DSAvatarProps> = ({
  name = "User",
  imageUri,
  size = "md",
  onEdit,
  style,
}) => {
  const getInitials = (text: string): string => {
    const parts = text.trim().split(/\s+/);
    if (!parts.length || !parts[0]) return "U";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getDimensions = (): { dimension: number; fontSize: number; editBadgeSize: number } => {
    switch (size) {
      case "sm":
        return {
          dimension: semanticTokens.geometry.avatarSmall,
          fontSize: 13,
          editBadgeSize: 14,
        };
      case "lg":
        return {
          dimension: semanticTokens.geometry.avatarLarge,
          fontSize: 28,
          editBadgeSize: 26,
        };
      case "md":
      default:
        return {
          dimension: semanticTokens.geometry.avatarMedium,
          fontSize: 16,
          editBadgeSize: 18,
        };
    }
  };

  const dims = getDimensions();

  const content = (
    <View
      style={[
        styles.avatarBase,
        {
          width: dims.dimension,
          height: dims.dimension,
          borderRadius: dims.dimension / 2,
        },
        style,
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{
            width: dims.dimension,
            height: dims.dimension,
            borderRadius: dims.dimension / 2,
          }}
        />
      ) : (
        <DSText
          variant="body"
          color="primary"
          weight="bold"
          style={{ fontSize: dims.fontSize }}
        >
          {getInitials(name)}
        </DSText>
      )}

      {onEdit && (
        <View
          style={[
            styles.editBadge,
            {
              width: dims.editBadgeSize,
              height: dims.editBadgeSize,
              borderRadius: dims.editBadgeSize / 2,
            },
          ]}
        >
          <Ionicons
            name="pencil"
            size={Math.max(10, dims.editBadgeSize - 8)}
            color="#FFFFFF"
          />
        </View>
      )}
    </View>
  );

  if (onEdit) {
    return (
      <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel={`Editar avatar de ${name}`}>
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  avatarBase: {
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderColor: semanticTokens.colors.accent.primary,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: semanticTokens.colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: semanticTokens.colors.background.base,
  },
});
