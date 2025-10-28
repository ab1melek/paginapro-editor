import ReadOnlyPage from "../../components/ReadOnlyPage";
import { APP } from '../../lib/config.js';

export default async function PaginaPorSlug({ params }) {
  // Await params antes de destructurar
  const { slug } = await params;
  const baseURL = APP?.baseURL || `http://localhost:${APP?.port || 3000}`;
  const res = await fetch(`${baseURL}/api/editor?slug=${slug}&includeOwnerStatus=true`, { cache: "no-store" });
  if (!res.ok) return <ReadOnlyPage pageData={null} />;
  const pageData = await res.json();

  // La página principal (portada) NO está sujeta a verificación de suscripción
  const HOME_SLUG = (process.env.HOME_SLUG || 'paginaprolanding').toLowerCase();
  if (slug.toLowerCase() === HOME_SLUG) {
    return <ReadOnlyPage pageData={pageData} />;
  }

  // Verificar estado de suscripción del propietario (solo para páginas de usuarios)
  try {
    const owner = pageData.ownerStatus;

    if (owner) {
      const now = new Date();
      const expiresAt = owner.subscription_expires_at ? new Date(owner.subscription_expires_at) : null;

      // Usuario especial → siempre mostrar (sin restricciones)
      if (owner.is_special) {
        return <ReadOnlyPage pageData={pageData} />;
      }

      // Suscripción activa → mostrar
      if (owner.subscription_status === "active") {
        return <ReadOnlyPage pageData={pageData} />;
      }

      // Trial dentro del plazo → mostrar
      if (owner.subscription_status === "trial" && expiresAt && expiresAt > now) {
        return <ReadOnlyPage pageData={pageData} />;
      }

      // Suscripción cancelada pero aún dentro del período pagado → MOSTRAR (usuario pagó, puede usar hasta el final)
      if (owner.subscription_status === "canceled" && expiresAt && expiresAt > now) {
        return <ReadOnlyPage pageData={pageData} />;
      }

      // Suscripción cancelada y período expirado → BLOQUEAR
      if (owner.subscription_status === "canceled" && (!expiresAt || expiresAt <= now)) {
        return (
          <div style={{
            textAlign: "center",
            padding: "100px 20px",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f3f4f6",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}>
            <h1 style={{ color: "#ef4444", marginBottom: "10px", fontSize: "28px" }}>
              🔒 Suscripción cancelada
            </h1>
            <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "16px" }}>
              La página no está disponible. Por favor, contacta al propietario para más información.
            </p>
          </div>
        );
      }

      // Trial/suscripción expirada → BLOQUEAR
      return (
        <div style={{
          textAlign: "center",
          padding: "100px 20px",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f3f4f6",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          <h1 style={{ color: "#ef4444", marginBottom: "10px", fontSize: "28px" }}>
            🔒 Suscripción expirada
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "16px" }}>
            La página no está disponible. Por favor, contacta al propietario para más información.
          </p>
        </div>
      );
    }
  } catch (err) {
    console.error("Error verificando suscripción:", err);
    // En caso de error, mostrar la página (no bloquear)
  }

  return <ReadOnlyPage pageData={pageData} />;
}

// SEO por página (no afecta el render). Extrae título/descr del HERO y primer párrafo.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const baseURL = APP?.baseURL || `http://localhost:${APP?.port || 3000}`;
  const site = process.env.NEXT_PUBLIC_SITE_URL || baseURL;
  const url = `${site}/${encodeURIComponent(slug)}`;

  try {
    const res = await fetch(`${baseURL}/api/editor?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const root = Array.isArray(data) ? (data[0] || {}) : (data || {});
      const blocks = Array.isArray(root.blocks) ? root.blocks : [];
      const ps = root.pageSettings || {};

      // 1) Overrides SEO si existieran en pageSettings
      let title = ps.seoTitle || root.slug || root.name || slug;
      let description = ps.seoDescription || '';

      // 2) Prioriza HERO: header + paragraph (sin CTA)
      if (!ps.seoTitle || !ps.seoDescription) {
        const hero = blocks.find(b => b?.type === 'hero');
        if (hero && Array.isArray(hero.data?.blocks)) {
          const heroHeader = hero.data.blocks.find(b => b?.type === 'header');
          const heroParagraph = hero.data.blocks.find(b => b?.type === 'paragraph');
          if (!ps.seoTitle && heroHeader?.data?.text) {
            title = heroHeader.data.text.replace(/<[^>]+>/g, '').trim() || title;
          }
          if (!ps.seoDescription && heroParagraph?.data?.text) {
            description = heroParagraph.data.text.replace(/<[^>]+>/g, '').trim().slice(0, 160);
          }
        }
      }

      // 3) Fallback: primer párrafo fuera del HERO
      if (!description) {
        const firstParagraph = blocks.find(b => b.type === 'paragraph');
        description = firstParagraph?.data?.text?.replace(/<[^>]+>/g, '').trim().slice(0, 160) || '';
      }

      const meta = {
        title,
        description: description || undefined,
        alternates: { canonical: url },
        openGraph: { title, description: description || undefined, url, type: 'article' },
        twitter: { card: 'summary_large_image', title, description: description || undefined },
      };

      if (process.env.NOINDEX === '1') {
        meta.robots = { index: false, follow: false };
      }
      return meta;
    }
  } catch {}

  const fallback = { title: slug, alternates: { canonical: url } };
  if (process.env.NOINDEX === '1') fallback.robots = { index: false, follow: false };
  return fallback;
}