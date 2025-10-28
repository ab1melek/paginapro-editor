"use client";

import { useState } from "react";

/**
 * CancelSubscriptionModal
 * Muestra un modal de confirmación para cancelar la suscripción
 * Requiere subscription_id del usuario actual
 */
export default function CancelSubscriptionModal({ 
  isOpen, 
  onClose, 
  subscriptionId, 
  onCancelSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("confirm"); // 'confirm' | 'typing' | 'processing'
  const [userInput, setUserInput] = useState("");
  
  const requiredText = "sí, quiero cancelar mi suscripción";

  if (!isOpen) return null;

  const handleCancel = () => {
    setError(null);
    setUserInput("");
    setStep("confirm");
    onClose();
  };

  const handleNext = () => {
    if (step === "confirm") {
      setStep("typing");
    }
  };

  const handleConfirmCancel = async () => {
    if (userInput.toLowerCase().trim() !== requiredText.toLowerCase()) {
      setError("El texto no coincide. Por favor, escribe exactamente el texto indicado.");
      return;
    }

    setLoading(true);
    setError(null);
    setStep("processing");

    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId,
          confirmed: true,
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error("Error parsing JSON response:", parseErr);
        data = { error: "Respuesta inválida del servidor" };
      }

      if (!response.ok) {
        throw new Error(data?.error || "Error al cancelar la suscripción");
      }

      console.log("✅ Suscripción cancelada:", data);

      // Mostrar éxito y cerrar
      alert("Tu suscripción ha sido cancelada exitosamente.");
      
      if (onCancelSuccess) {
        onCancelSuccess();
      }

      handleCancel();
    } catch (err) {
      console.error("❌ Error al cancelar suscripción:", err);
      setError(err.message || "Error al procesar la cancelación");
      setStep("typing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
      }}
      onClick={handleCancel}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {step === "confirm" && (
          <>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", color: "#1f2937" }}>
              ⚠️ Cancelar suscripción
            </h2>
            <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#6b7280" }}>
              Si cancelas tu suscripción:
            </p>
            <ul style={{ margin: "0 0 24px 0", paddingLeft: "20px", fontSize: "14px", color: "#6b7280" }}>
              <li>Deja de funcionar tu página/s después de que expire tu período actual</li>
              <li>NO habrá cobros automáticos futuros</li>
              <li>Puedes reactivar tu suscripción cuando quieras</li>
            </ul>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: "10px 16px",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f3f4f6",
                  color: "#1f2937",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                Volver
              </button>
              <button
                onClick={handleNext}
                style={{
                  padding: "10px 16px",
                  borderRadius: "6px",
                  border: "1px solid #ef4444",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                Sí, cancelar
              </button>
            </div>
          </>
        )}

        {step === "typing" && (
          <>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", color: "#1f2937" }}>
              Confirmación final
            </h2>
            <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#6b7280" }}>
              Para confirmar que deseas cancelar tu suscripción, escribe:
            </p>
            <p
              style={{
                margin: "0 0 16px 0",
                padding: "12px",
                backgroundColor: "#f3f4f6",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#1f2937",
                fontFamily: "monospace",
              }}
            >
              {requiredText}
            </p>

            <input
              type="text"
              placeholder="Escribe aquí..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && userInput.toLowerCase().trim() === requiredText.toLowerCase()) {
                  handleConfirmCancel();
                }
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
                fontSize: "14px",
                marginBottom: "12px",
                boxSizing: "border-box",
              }}
              autoFocus
            />

            {error && (
              <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#ef4444" }}>
                ❌ {error}
              </p>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setUserInput("");
                  setError(null);
                  setStep("confirm");
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f3f4f6",
                  color: "#1f2937",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                Volver
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={loading || userInput.toLowerCase().trim() !== requiredText.toLowerCase()}
                style={{
                  padding: "10px 16px",
                  borderRadius: "6px",
                  border: "1px solid #ef4444",
                  backgroundColor:
                    loading || userInput.toLowerCase().trim() !== requiredText.toLowerCase()
                      ? "#fca5a5"
                      : "#ef4444",
                  color: "#fff",
                  cursor:
                    loading || userInput.toLowerCase().trim() !== requiredText.toLowerCase()
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                {loading ? "Procesando..." : "Cancelar suscripción"}
              </button>
            </div>
          </>
        )}

        {step === "processing" && (
          <>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", color: "#1f2937" }}>
              Procesando cancelación...
            </h2>
            <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#6b7280" }}>
              Por favor, espera mientras procesamos tu solicitud.
            </p>
            <div
              style={{
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  width: "40px",
                  height: "40px",
                  border: "4px solid #e5e7eb",
                  borderTop: "4px solid #ef4444",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </>
        )}
      </div>
    </div>
  );
}
