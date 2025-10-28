import fs from 'fs';
import path from 'path';

const filePath = path.join(
  process.cwd(),
  'app',
  '[slug]',
  'page.js'
);

console.log(`📝 Actualizando ${filePath}...`);

let content = fs.readFileSync(filePath, 'utf-8');

// Buscar el bloque de verificación de trial
const oldBlock = `      // Trial dentro del plazo → mostrar
      if (owner.subscription_status === "trial" && expiresAt && expiresAt > now) {
        return <ReadOnlyPage pageData={pageData} />;
      }

      // Trial/suscripción expirada → BLOQUEAR`;

const newBlock = `      // Trial dentro del plazo → mostrar
      if (owner.subscription_status === "trial" && expiresAt && expiresAt > now) {
        return <ReadOnlyPage pageData={pageData} />;
      }

      // Suscripción cancelada manualmente → BLOQUEAR
      if (owner.subscription_status === "canceled") {
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

      // Trial/suscripción expirada → BLOQUEAR`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('✅ Archivo [slug]/page.js actualizado correctamente');
  console.log('   - Agregado: bloqueo para suscripciones canceladas');
} else {
  console.error('❌ No se encontró el bloque de código a reemplazar');
  console.error('   Verifica que el archivo tenga la estructura esperada');
  process.exit(1);
}
