"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CancelSubscriptionModal from "../../components/CancelSubscriptionModal";
import PageList from "../../components/PageList";
import SubscriptionButton from "../../components/SubscriptionButton";

export default function DashboardPage() {
  const [pages, setPages] = useState([]);
  const [me, setMe] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const router = useRouter();

  // Obtener las páginas existentes
  const fetchPages = async () => {
    try {
      console.log("Obteniendo lista de páginas...");
      const response = await fetch("/api/editor");
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Páginas obtenidas:", data);
      setPages(data || []);
    } catch (error) {
      console.error("Error al obtener páginas:", error);
      alert(`Error al cargar las páginas: ${error.message}`);
      setPages([]); // Lista vacía como fallback
    }
  };

  // Manejar la creación de una nueva página
  const handleCreate = () => {
    router.push(`/dashboard/new`); // Redirigir al selector de plantillas
  };

  // (Eliminado) Quick create por plantilla directa para simplificar la barra

  // Manejar la edición de una página: primero obtener y loguear datos
  const handleEdit = async (id) => {
    try {
      const res = await fetch(`/api/editor?id=${id}`);
      if (res.ok) {
        const pageData = await res.json();
        console.log("Datos de la página antes de navegar:", pageData);
      } else {
        console.warn("No se pudo obtener la página", id);
      }
    } catch (e) {
      console.error("Error al obtener la página antes de editar:", e);
    }
    router.push(`/dashboard/editor?id=${id}`); // Redirigir al editor con el ID de la página
  };

  // Manejar la eliminación de una página
  const handleDelete = async (id) => {
    if (!id) {
      console.error("ID de página no válido:", id);
      alert("Error: ID de página no válido");
      return;
    }

    const confirmDelete = confirm("¿Estás seguro de que deseas eliminar esta página?");
    if (confirmDelete) {
      try {
        console.log("Eliminando página con ID:", id);
        const response = await fetch(`/api/editor?id=${encodeURIComponent(id)}`, { 
          method: "DELETE",
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log("Respuesta de eliminación:", response.status, response.statusText);
        
        let result = null;
        try { 
          result = await response.json(); 
          console.log("Resultado de eliminación:", result);
        } catch (jsonError) {
          console.warn("No se pudo parsear JSON de respuesta:", jsonError);
        }
        
        if (response.ok) {
          alert(result?.message || 'Página eliminada correctamente');
          await fetchPages(); // Recargar la lista
        } else {
          const errorMsg = result?.error || `Error ${response.status}: ${response.statusText}`;
          console.error("Error del servidor:", errorMsg);
          alert(`No se pudo eliminar la página: ${errorMsg}`);
        }
      } catch (error) {
        console.error("Error al eliminar la página:", error);
        alert(`Error de conexión al eliminar la página: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    fetchPages();
    
    // Cargar usuario actual para mostrarlo y ofrecer logout
    const fetchUser = async () => {
      try {
        const r = await fetch('/api/auth/me', { cache: 'no-store' });
        const j = await r.json();
        setMe(j?.user || null);
      } catch {}
    };

    fetchUser();

    // Auto-refresh del estado de suscripción cada 30 segundos
    // Esto asegura que si la suscripción expira, el usuario lo vea sin recargar
    const interval = setInterval(fetchUser, 30000);

    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.replace('/login');
  }

  async function handleCancelSuccess() {
    // Recargar el usuario para actualizar su estado
    try {
      const r = await fetch('/api/auth/me', { cache: 'no-store' });
      const j = await r.json();
      setMe(j?.user || null);
    } catch {}
  }

  function getSubscriptionBadge() {
    if (!me) return null;

    // Usuario especial
    if (me.is_special) {
      return (
        <div style={{
          padding: "8px 12px",
          backgroundColor: "#f3e8ff",
          color: "#7c3aed",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "600",
        }}>
          ⭐ Usuario especial - Sin restricciones
        </div>
      );
    }

    const now = new Date();
    const expiresAt = me.subscription_expires_at ? new Date(me.subscription_expires_at) : null;
    const daysLeft = expiresAt ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)) : 0;

    // Prueba gratuita activa
    if (me.subscription_status === "trial" && daysLeft > 0) {
      return (
        <div style={{
          padding: "8px 12px",
          backgroundColor: "#eff6ff",
          color: "#3b82f6",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "600",
        }}>
          🎁 Prueba gratuita - {daysLeft} días restantes
        </div>
      );
    }

    // Suscripción activa
    if (me.subscription_status === "active" && daysLeft > 0) {
      const renewalText = ` - Renueva en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`;
      
      return (
        <div style={{
          padding: "8px 12px",
          backgroundColor: "#f0fdf4",
          color: "#10b981",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <span>✅ Suscripción activa{renewalText}</span>
          <button
            onClick={() => setIsCancelModalOpen(true)}
            style={{
              padding: "4px 12px",
              backgroundColor: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Cancelar
          </button>
        </div>
      );
    }

    // Suscripción activa pero expirada naturalmente (sin cancelar)
    if (me.subscription_status === "active" && daysLeft <= 0) {
      return (
        <div style={{
          padding: "8px 12px",
          backgroundColor: "#fef2f2",
          color: "#ef4444",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span>⚠️ Suscripción expirada</span>
          <SubscriptionButton />
        </div>
      );
    }

    // Suscripción cancelada manualmente (pero aún dentro del período pagado)
    if (me.subscription_status === "canceled" && daysLeft > 0) {
      return (
        <div style={{
          padding: "8px 12px",
          backgroundColor: "#fef3c7",
          color: "#92400e",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <span>⏳ Suscripción cancelada - {daysLeft} día{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''}</span>
          <SubscriptionButton style={{
            padding: "4px 12px",
            backgroundColor: "#f59e0b",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }} />
        </div>
      );
    }

    // Suscripción cancelada y expirada
    if (me.subscription_status === "canceled" && daysLeft <= 0) {
      return (
        <div style={{
          padding: "8px 12px",
          backgroundColor: "#fef2f2",
          color: "#ef4444",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span>🔒 Suscripción cancelada</span>
          <SubscriptionButton />
        </div>
      );
    }

    // Suscripción expirada
    if (me.subscription_status === "expired" || (daysLeft <= 0 && me.subscription_status === "trial")) {
      return (
        <div style={{
          padding: "8px 12px",
          backgroundColor: "#fef2f2",
          color: "#ef4444",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span>⚠️ Suscripción expirada</span>
          <SubscriptionButton />
        </div>
      );
    }

    return null;
  }

  return (
    <main style={{ padding: 24 }}>
      {/* Badge de suscripción */}
      {getSubscriptionBadge() && (
        <div style={{
          marginBottom: "16px",
        }}>
          {getSubscriptionBadge()}
        </div>
      )}

      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        border: '1px solid #e9ecef', borderRadius: 12, padding: '12px 16px', marginBottom: 16,
        background: '#fff', boxShadow: 'inset 0 -1px 0 #f1f1f1'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Dashboard</h1>
          <p style={{ margin: 0, opacity: 0.7, fontSize: 13 }}>Administra tus páginas</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {me && (
            <span style={{ fontSize: 13, color: '#374151', marginRight: 8 }}>
              Hola, <strong>{me.username || me.email || me.id}</strong>{me.is_special ? ' (especial)' : ''}
            </span>
          )}
          <button onClick={handleCreate} style={{
            padding: '10px 14px', borderRadius: 8, border: '1px solid #374151', background: '#374151', color: '#fff', cursor: 'pointer', fontWeight: 700
          }}>
            + Crear desde plantilla
          </button>
          {me?.username?.toLowerCase() === 'gatunoide' && (
            <button onClick={() => router.push(`/dashboard/editor?slug=${encodeURIComponent(process.env.NEXT_PUBLIC_HOME_SLUG || 'paginaprolanding')}`)} style={{
              padding: '10px 14px', borderRadius: 8, border: '1px solid #111827', background: '#111827', color: '#fff', cursor: 'pointer', fontWeight: 700
            }}>
              Editar portada
            </button>
          )}
          <button onClick={handleLogout} style={{
            padding: '10px 14px', borderRadius: 8, border: '1px solid #ef4444', background: '#fff', color: '#ef4444', cursor: 'pointer', fontWeight: 700
          }}>
            Cerrar sesión
          </button>
        </div>
      </div>
      <PageList pages={pages} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Modal de cancelación de suscripción */}
      <CancelSubscriptionModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        subscriptionId={me?.stripe_subscription_id}
        onCancelSuccess={handleCancelSuccess}
      />
    </main>
  );
}