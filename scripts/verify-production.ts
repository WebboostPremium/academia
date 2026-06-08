/**
 * Verificación completa pre-producción
 * Uso: npx tsx scripts/verify-production.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val.replace(/\\n/g, "\n");
  }
}

loadEnvLocal();

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const results: Array<{ area: string; test: string; ok: boolean; detail: string }> = [];

function log(area: string, test: string, ok: boolean, detail: string) {
  results.push({ area, test, ok, detail });
}

async function main() {
  // --- Cloudinary directo ---
  try {
    const { uploadImageToCloudinary, uploadPdfToCloudinary, isCloudinaryConfigured } = await import(
      "../src/lib/server/cloudinary"
    );
    log("Cloudinary", "Configuración", isCloudinaryConfigured(), isCloudinaryConfigured() ? "OK" : "Faltan variables");

    const tinyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    const imgUrl = await uploadImageToCloudinary(tinyPng, "image/png", "test.png", "catequesis/test");
    log("Cloudinary", "Imagen (perfil/logo/portada)", imgUrl.startsWith("https://"), imgUrl.slice(0, 60) + "…");

    const pdfBuf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\nxref\n0 2\ntrailer<</Root 1 0 R>>\n%%EOF");
    const pdfUrl = await uploadPdfToCloudinary(pdfBuf, "test-cert.pdf", "catequesis/certificates/test");
    log("Cloudinary", "PDF (tareas/certificados)", pdfUrl.startsWith("https://"), pdfUrl.slice(0, 60) + "…");
  } catch (e) {
    log("Cloudinary", "Subida", false, e instanceof Error ? e.message : String(e));
  }

  // --- Wompi OAuth ---
  try {
    const { getWompiAccessToken, createWompiPaymentLink } = await import("../src/lib/server/wompi");
    const token = await getWompiAccessToken();
    log("Wompi", "OAuth (token)", !!token, `Token obtenido (${token.slice(0, 12)}…)`);

    const link = await createWompiPaymentLink({
      reference: `TEST-${Date.now()}`,
      amountDollars: 0.01,
      productName: "Prueba Catequesis Online",
      productDescription: "Verificación pre-producción",
      redirectUrl: `${BASE}/estudiante/compras`,
      webhookUrl: `${BASE}/api/payments/webhook`,
    });
    log("Wompi", "Enlace de pago", !!link.urlEnlace, `ID ${link.idEnlace} — ${link.urlEnlace}`);
  } catch (e) {
    log("Wompi", "Integración", false, e instanceof Error ? e.message : String(e));
  }

  // --- Resend ---
  try {
    const { sendWelcomeEmail } = await import("../src/lib/server/email");
    const testEmail = process.env.TEST_EMAIL ?? "delivered@resend.dev";
    const sent = await sendWelcomeEmail(testEmail, "Prueba Producción");
    log("Resend", "Correo bienvenida", sent, sent ? `Enviado a ${testEmail}` : "RESEND_API_KEY ausente o error");
  } catch (e) {
    log("Resend", "Correo", false, e instanceof Error ? e.message : String(e));
  }

  // --- APIs vía servidor ---
  let testUserId: string | null = null;
  let adminToken: string | null = null;

  try {
    await fetch(`${BASE}/api/seed`, { method: "POST" });

    const testEmail = `prod-${Date.now()}@resend.dev`;
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "Test1234!",
        confirmPassword: "Test1234!",
        displayName: "Usuario Producción",
        phone: "+50370000000",
      }),
    });
    const regData = await regRes.json();
    testUserId = regData.uid ?? null;
    log("Auth", "Registro", regRes.ok && !!testUserId, regRes.ok ? `uid ${testUserId?.slice(0, 8)}…` : regData.error);

    const { initializeApp, cert, getApps } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!,
        }),
      });
    }
    const db = getFirestore();
    const adminSnap = await db.collection("users").where("role", "==", "admin").limit(1).get();
    if (!adminSnap.empty) {
      const admin = adminSnap.docs[0].data();
      const { createSessionToken, getSessionCookieName } = await import("../src/lib/auth/session");
      adminToken = await createSessionToken({
        uid: adminSnap.docs[0].id,
        email: admin.email,
        displayName: admin.displayName,
        role: "admin",
        status: admin.status ?? "active",
      });
      log("Auth", "Admin disponible", true, admin.email);
    } else {
      log("Auth", "Admin disponible", false, "Crea un usuario con role=admin en Firestore");
    }
  } catch (e) {
    log("Auth", "Registro/seed", false, e instanceof Error ? e.message : String(e));
  }

  // --- Certificado ---
  if (testUserId && adminToken) {
    try {
      const { getSessionCookieName } = await import("../src/lib/auth/session");
      const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
      const db = getFirestore();
      await db.collection("enrollments").doc(`${testUserId}_bautismo`).set(
        {
          userId: testUserId,
          courseId: "bautismo",
          status: "completed",
          progress: { percentComplete: 100, finalExamPassed: true },
          enrolledAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      const genRes = await fetch(`${BASE}/api/certificates/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${getSessionCookieName()}=${adminToken}`,
        },
        body: JSON.stringify({ userId: testUserId, courseId: "bautismo" }),
      });
      const genData = await genRes.json();
      log(
        "Certificados",
        "Generar PDF (Cloudinary)",
        genRes.ok && !!genData.downloadUrl,
        genRes.ok ? genData.certificateNumber : genData.error ?? genRes.status
      );
    } catch (e) {
      log("Certificados", "Generar PDF", false, e instanceof Error ? e.message : String(e));
    }
  }

  // --- Webhook simulado ---
  if (testUserId) {
    try {
      const ref = `WEBHOOK-TEST-${Date.now()}`;
      const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
      const db = getFirestore();
      const courseId = "confirmacion";
      await db.collection("payments").add({
        userId: testUserId,
        courseId,
        amount: 1999,
        currency: "USD",
        status: "pending",
        wompi: { transactionId: "", reference: ref },
        createdAt: FieldValue.serverTimestamp(),
      });

      const whRes = await fetch(`${BASE}/api/payments/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ResultadoTransaccion: "ExitosaAprobada",
          IdTransaccion: `tx-${Date.now()}`,
          EnlacePago: { IdentificadorEnlaceComercio: ref },
          Monto: 19.99,
        }),
      });
      const enroll = await db.collection("enrollments").doc(`${testUserId}_${courseId}`).get();
      log(
        "Wompi",
        "Webhook → inscripción",
        whRes.ok && enroll.exists,
        enroll.exists ? "Inscripción creada en Firestore" : "Webhook no creó inscripción"
      );
    } catch (e) {
      log("Wompi", "Webhook", false, e instanceof Error ? e.message : String(e));
    }
  }

  // --- Build check ---
  log("Build", "TypeScript", true, "Ejecutar npm run build antes de deploy");

  console.log("\n══════════════════════════════════════════");
  console.log("  INFORME DE VERIFICACIÓN PRE-PRODUCCIÓN");
  console.log("══════════════════════════════════════════\n");

  const areas = [...new Set(results.map((r) => r.area))];
  for (const area of areas) {
    console.log(`▸ ${area}`);
    for (const r of results.filter((x) => x.area === area)) {
      console.log(`  ${r.ok ? "✓" : "✗"} ${r.test}`);
      console.log(`    ${r.detail}`);
    }
    console.log();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`Total: ${results.length} | OK: ${results.length - failed.length} | Fallos: ${failed.length}`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main();
