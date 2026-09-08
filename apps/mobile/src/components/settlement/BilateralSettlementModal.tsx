import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDOP, type SimplifiedTransfer, type Serrucho } from "@serrucho/core";
import { useAppTheme } from "../../theme/colors";
import { triggerHaptic } from "../../utils/haptics";
import type { BilateralSettlement } from "../../services/storage";
import {
  DSText,
  DSButton,
  DSSurface,
  DSBadge,
} from "../ds";

export interface BilateralSettlementModalProps {
  visible: boolean;
  debt: SimplifiedTransfer | null;
  myParticipantId: string | null;
  serrucho: Serrucho | null;
  activeSettlement: BilateralSettlement | null;
  onDismiss: () => void;
  onInitiate: (paymentMethod: "TRANSFER" | "CASH" | "OTHER") => Promise<void>;
  onCreditorConfirm: () => Promise<void>;
  onCreditorReject: () => Promise<void>;
  onVerifyCode: (code: string) => Promise<boolean>;
  onOpenIdentityModal?: () => void;
}

export const BilateralSettlementModal: React.FC<BilateralSettlementModalProps> = ({
  visible,
  debt,
  myParticipantId,
  serrucho,
  activeSettlement,
  onDismiss,
  onInitiate,
  onCreditorConfirm,
  onCreditorReject,
  onVerifyCode,
  onOpenIdentityModal,
}) => {
  const { tokens } = useAppTheme();

  const [paymentMethod, setPaymentMethod] = useState<"TRANSFER" | "CASH" | "OTHER">("TRANSFER");
  const [enteredCode, setEnteredCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!visible || !debt) return null;

  const isDebtor = myParticipantId === debt.from_participant_id;
  const isCreditor = myParticipantId === debt.to_participant_id;
  const isUnrelated = !isDebtor && !isCreditor;

  const handleInitiateClick = async () => {
    try {
      setLoading(true);
      await onInitiate(paymentMethod);
    } finally {
      setLoading(false);
    }
  };

  const handleCreditorConfirmClick = async () => {
    try {
      setLoading(true);
      await onCreditorConfirm();
    } finally {
      setLoading(false);
    }
  };

  const handleCreditorRejectClick = async () => {
    try {
      setLoading(true);
      await onCreditorReject();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCodeClick = async () => {
    if (enteredCode.trim().length !== 4) {
      setCodeError("El código debe contener exactamente 4 dígitos.");
      triggerHaptic("error");
      return;
    }
    try {
      setLoading(true);
      const success = await onVerifyCode(enteredCode.trim());
      if (!success) {
        setCodeError("Código incorrecto. Verifica el código de 4 dígitos con el acreedor.");
        triggerHaptic("error");
      } else {
        setCodeError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.modalOverlay, { backgroundColor: tokens.colors.overlay }]}>
        <DSSurface variant="elevated" style={styles.modalContainer}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <DSText variant="title" weight="bold">
              Liquidación de Deuda ⚖️
            </DSText>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={tokens.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Debt Summary Pill */}
          <View style={[styles.summaryBox, { backgroundColor: tokens.colors.surface.hover, borderColor: tokens.colors.divider }]}>
            <View style={styles.partyRow}>
              <DSText variant="body" weight="semibold">
                {debt.from_name}
              </DSText>
              <Ionicons name="arrow-forward" size={16} color={tokens.colors.text.muted} />
              <DSText variant="body" weight="semibold">
                {debt.to_name}
              </DSText>
            </View>
            <DSText variant="title" weight="bold" color="accent" style={{ marginTop: 4 }}>
              {formatDOP(debt.amount_cents)}
            </DSText>
          </View>

          {/* Case 1: Unrelated Participant or No Claimed Identity */}
          {isUnrelated ? (
            <View style={styles.contentSection}>
              <View style={[styles.securityNotice, { backgroundColor: tokens.colors.surface.hover, borderColor: tokens.colors.divider }]}>
                <Ionicons name="shield-checkmark" size={28} color={tokens.colors.accent.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <DSText variant="body" weight="bold" style={{ marginBottom: 4 }}>
                    Liquidación Bilateral Protegida
                  </DSText>
                  <DSText variant="caption" color="secondary">
                    Por seguridad financiera, solo <DSText variant="caption" weight="bold">{debt.from_name}</DSText> (deudor) o{" "}
                    <DSText variant="caption" weight="bold">{debt.to_name}</DSText> (acreedor) pueden iniciar o confirmar este saldo.
                  </DSText>
                </View>
              </View>

              {activeSettlement ? (
                <View style={{ marginTop: 12, alignItems: "center" }}>
                  <DSBadge
                    label={
                      activeSettlement.status === "PENDING_CONFIRMATION"
                        ? "Estado: Confirmación de pago pendiente"
                        : "Estado: Código de 4 dígitos pendiente"
                    }
                    variant="accent"
                    size="sm"
                  />
                </View>
              ) : null}

              {!myParticipantId && onOpenIdentityModal ? (
                <DSButton
                  title="Seleccionar Quién Soy 👤"
                  variant="primary"
                  onPress={() => {
                    onDismiss();
                    onOpenIdentityModal();
                  }}
                  style={{ marginTop: 16 }}
                />
              ) : (
                <DSButton
                  title="Cerrar"
                  variant="secondary"
                  onPress={onDismiss}
                  style={{ marginTop: 16 }}
                />
              )}
            </View>
          ) : isDebtor ? (
            /* Case 2: Current User is Debtor */
            <View style={styles.contentSection}>
              {!activeSettlement || activeSettlement.status === "REJECTED" ? (
                <>
                  <DSText variant="body" color="secondary" style={{ marginBottom: 12 }}>
                    Indica cómo realizaste o realizarás el pago a <DSText variant="body" weight="bold">{debt.to_name}</DSText>:
                  </DSText>

                  {/* Payment Method Radio Options */}
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic("selection");
                      setPaymentMethod("TRANSFER");
                    }}
                    style={[
                      styles.methodOption,
                      {
                        borderColor: paymentMethod === "TRANSFER" ? tokens.colors.accent.primary : tokens.colors.divider,
                        backgroundColor: paymentMethod === "TRANSFER" ? tokens.colors.surface.hover : "transparent",
                      },
                    ]}
                  >
                    <Ionicons name="card-outline" size={20} color={tokens.colors.accent.primary} />
                    <DSText variant="body" weight={paymentMethod === "TRANSFER" ? "bold" : "regular"} style={{ marginLeft: 10, flex: 1 }}>
                      Transferencia (Popular, BHD, Banreservas, Qik)
                    </DSText>
                    {paymentMethod === "TRANSFER" ? (
                      <Ionicons name="checkmark-circle" size={18} color={tokens.colors.accent.primary} />
                    ) : null}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic("selection");
                      setPaymentMethod("CASH");
                    }}
                    style={[
                      styles.methodOption,
                      {
                        borderColor: paymentMethod === "CASH" ? tokens.colors.accent.primary : tokens.colors.divider,
                        backgroundColor: paymentMethod === "CASH" ? tokens.colors.surface.hover : "transparent",
                      },
                    ]}
                  >
                    <Ionicons name="cash-outline" size={20} color={tokens.colors.success.base} />
                    <DSText variant="body" weight={paymentMethod === "CASH" ? "bold" : "regular"} style={{ marginLeft: 10, flex: 1 }}>
                      Efectivo en mano 💵
                    </DSText>
                    {paymentMethod === "CASH" ? (
                      <Ionicons name="checkmark-circle" size={18} color={tokens.colors.accent.primary} />
                    ) : null}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic("selection");
                      setPaymentMethod("OTHER");
                    }}
                    style={[
                      styles.methodOption,
                      {
                        borderColor: paymentMethod === "OTHER" ? tokens.colors.accent.primary : tokens.colors.divider,
                        backgroundColor: paymentMethod === "OTHER" ? tokens.colors.surface.hover : "transparent",
                      },
                    ]}
                  >
                    <Ionicons name="phone-portrait-outline" size={20} color={tokens.colors.text.secondary} />
                    <DSText variant="body" weight={paymentMethod === "OTHER" ? "bold" : "regular"} style={{ marginLeft: 10, flex: 1 }}>
                      Otro medio 📱
                    </DSText>
                    {paymentMethod === "OTHER" ? (
                      <Ionicons name="checkmark-circle" size={18} color={tokens.colors.accent.primary} />
                    ) : null}
                  </TouchableOpacity>

                  {activeSettlement?.status === "REJECTED" ? (
                    <View style={[styles.warningBox, { backgroundColor: tokens.colors.destructive.light, borderColor: tokens.colors.destructive.base }]}>
                      <DSText variant="caption" style={{ color: tokens.colors.destructive.hover }}>
                        El intento anterior fue rechazado por {debt.to_name}. Puedes solicitarlo de nuevo.
                      </DSText>
                    </View>
                  ) : null}

                  <DSButton
                    title={loading ? "Enviando solicitud..." : `Solicitar Confirmación a ${debt.to_name} 🚀`}
                    variant="primary"
                    size="lg"
                    disabled={loading}
                    onPress={handleInitiateClick}
                    style={{ marginTop: 16 }}
                  />
                </>
              ) : activeSettlement.status === "PENDING_CONFIRMATION" ? (
                <>
                  <View style={[styles.pendingBox, { backgroundColor: tokens.colors.surface.hover, borderColor: tokens.colors.divider }]}>
                    <Ionicons name="time-outline" size={32} color={tokens.colors.warning.base} />
                    <DSText variant="body" weight="bold" style={{ marginTop: 8 }}>
                      Esperando confirmación de {debt.to_name}...
                    </DSText>
                    <DSText variant="caption" color="secondary" style={{ textAlign: "center", marginTop: 4 }}>
                      Le indicaste que pagaste vía {activeSettlement.payment_method}. Tan pronto confirme la recepción, te entregará un código de 4 dígitos para cerrar el saldo.
                    </DSText>
                  </View>

                  <DSButton
                    title="Cerrar"
                    variant="secondary"
                    onPress={onDismiss}
                    style={{ marginTop: 16 }}
                  />
                </>
              ) : activeSettlement.status === "CODE_PENDING" ? (
                <>
                  <DSText variant="body" weight="bold" style={{ marginBottom: 4 }}>
                    Introduce el código de 4 dígitos 🔑
                  </DSText>
                  <DSText variant="caption" color="secondary" style={{ marginBottom: 12 }}>
                    {debt.to_name} ya confirmó recibir el pago. Ingresa el código numérico que te proporcionó:
                  </DSText>

                  <TextInput
                    value={enteredCode}
                    onChangeText={(val) => {
                      setEnteredCode(val.replace(/\D/g, "").slice(0, 4));
                      setCodeError(null);
                    }}
                    placeholder="0000"
                    placeholderTextColor={tokens.colors.text.muted}
                    keyboardType="number-pad"
                    maxLength={4}
                    style={[
                      styles.codeInput,
                      {
                        color: tokens.colors.text.primary,
                        borderColor: codeError ? tokens.colors.destructive.base : tokens.colors.accent.primary,
                        backgroundColor: tokens.colors.surface.hover,
                      },
                    ]}
                    autoFocus
                  />

                  {codeError ? (
                    <DSText variant="caption" style={{ color: tokens.colors.destructive.base, textAlign: "center", marginTop: 6 }}>
                      {codeError}
                    </DSText>
                  ) : null}

                  <DSButton
                    title={loading ? "Validando..." : "Validar Código y Liquidar ✅"}
                    variant="primary"
                    size="lg"
                    disabled={loading || enteredCode.length !== 4}
                    onPress={handleVerifyCodeClick}
                    style={{ marginTop: 16 }}
                  />
                </>
              ) : null}
            </View>
          ) : (
            /* Case 3: Current User is Creditor */
            <View style={styles.contentSection}>
              {!activeSettlement || activeSettlement.status === "REJECTED" ? (
                <>
                  <DSText variant="body" color="secondary" style={{ marginBottom: 12 }}>
                    <DSText variant="body" weight="bold">{debt.from_name}</DSText> aún no ha iniciado la solicitud de pago para esta deuda.
                  </DSText>
                  <DSText variant="caption" color="muted" style={{ marginBottom: 16 }}>
                    Puedes recordarle a {debt.from_name} por WhatsApp para que envíe el pago.
                  </DSText>

                  <DSButton
                    title="Recordar por WhatsApp 💬"
                    variant="primary"
                    onPress={() => {
                      const msg = `¡Hola ${debt.from_name}! Te recuerdo saldar ${formatDOP(debt.amount_cents)} en nuestro Serrucho "${serrucho?.name || ""}".`;
                      Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
                      onDismiss();
                    }}
                    style={{ marginBottom: 8 }}
                  />
                  <DSButton title="Cerrar" variant="secondary" onPress={onDismiss} />
                </>
              ) : activeSettlement.status === "PENDING_CONFIRMATION" ? (
                <>
                  <View style={[styles.pendingBox, { backgroundColor: tokens.colors.surface.hover, borderColor: tokens.colors.divider }]}>
                    <Ionicons name="help-circle-outline" size={32} color={tokens.colors.accent.primary} />
                    <DSText variant="body" weight="bold" style={{ marginTop: 8 }}>
                      ¿Recibiste este pago?
                    </DSText>
                    <DSText variant="caption" color="secondary" style={{ textAlign: "center", marginTop: 4 }}>
                      {debt.from_name} indica que te transfirió {formatDOP(debt.amount_cents)} vía {activeSettlement.payment_method}.
                    </DSText>
                  </View>

                  <View style={styles.dualButtonsRow}>
                    <DSButton
                      title="Rechazar ❌"
                      variant="destructive"
                      disabled={loading}
                      onPress={handleCreditorRejectClick}
                      style={{ flex: 1, marginRight: 6 }}
                    />
                    <DSButton
                      title="Confirmar Recibo ✅"
                      variant="primary"
                      disabled={loading}
                      onPress={handleCreditorConfirmClick}
                      style={{ flex: 1, marginLeft: 6 }}
                    />
                  </View>
                </>
              ) : activeSettlement.status === "CODE_PENDING" ? (
                <>
                  <DSText variant="body" weight="bold" style={{ textAlign: "center", marginBottom: 6 }}>
                    Código de Confirmación Generado 🔑
                  </DSText>
                  <DSText variant="caption" color="secondary" style={{ textAlign: "center", marginBottom: 12 }}>
                    Comparte este código con <DSText variant="caption" weight="bold">{debt.from_name}</DSText> para que finalice el saldo en su app:
                  </DSText>

                  {/* Big 4-Digit Code Box */}
                  <View style={[styles.codeDisplayBox, { backgroundColor: tokens.colors.surface.hover, borderColor: tokens.colors.accent.primary }]}>
                    <DSText variant="title" weight="bold" style={[styles.codeDigits, { color: tokens.colors.accent.primary }]}>
                      {activeSettlement.confirmation_code || "----"}
                    </DSText>
                  </View>

                  <DSText variant="caption" color="muted" style={{ textAlign: "center", marginTop: 10, marginBottom: 16 }}>
                    Una vez que {debt.from_name} introduzca este código, la deuda se liquidará automáticamente en los balances.
                  </DSText>

                  <DSButton
                    title="Listo, ya lo compartí 👍"
                    variant="primary"
                    onPress={onDismiss}
                  />
                </>
              ) : null}
            </View>
          )}
        </DSSurface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  summaryBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
  },
  partyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contentSection: {
    width: "100%",
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  methodOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  warningBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  pendingBox: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  dualButtonsRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  codeInput: {
    height: 60,
    borderRadius: 14,
    borderWidth: 2,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 10,
    textAlign: "center",
  },
  codeDisplayBox: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  codeDigits: {
    fontSize: 36,
    letterSpacing: 12,
  },
});
