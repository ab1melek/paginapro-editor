"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SubscriptionButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleCheckout = async (plan) => {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirige a Stripe Checkout hosted
        window.location.href = data.url;
      } else {
        alert("Error: " + (data.error || "No se pudo iniciar el pago"));
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error al iniciar pago");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {/* Botón para abrir modal */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: "10px 20px",
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "14px",
        }}
      >
        Actualizar suscripción
      </button>

      {/* Modal con planes */}
      {showModal && (
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
            zIndex: 9999,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "30px",
              maxWidth: "600px",
              width: "90%",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "20px", fontSize: "24px" }}>Elige tu plan</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              {/* Plan Mensual */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <h3 style={{ marginBottom: "10px" }}>Mensual</h3>
                <div style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>
                  $199
                </div>
                <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>
                  Renovación cada mes
                </p>
                <button
                  onClick={() => handleCheckout("monthly")}
                  disabled={loading === "monthly"}
                  style={{
                    width: "100%",
                    padding: "10px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    opacity: loading === "monthly" ? 0.6 : 1,
                  }}
                >
                  {loading === "monthly" ? "Procesando..." : "Elegir"}
                </button>
              </div>

              {/* Plan Anual */}
              <div
                style={{
                  border: "2px solid #10b981",
                  borderRadius: "8px",
                  padding: "20px",
                  textAlign: "center",
                  backgroundColor: "#f0fdf4",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-12px",
                    right: "15px",
                    backgroundColor: "#10b981",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  AHORRA 25%
                </div>
                <h3 style={{ marginBottom: "10px" }}>Anual</h3>
                <div style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>
                  $1,788
                </div>
                <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>
                  Renovación cada año
                </p>
                <button
                  onClick={() => handleCheckout("yearly")}
                  disabled={loading === "yearly"}
                  style={{
                    width: "100%",
                    padding: "10px",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    opacity: loading === "yearly" ? 0.6 : 1,
                  }}
                >
                  {loading === "yearly" ? "Procesando..." : "Elegir"}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#e5e7eb",
                color: "#1f2937",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
