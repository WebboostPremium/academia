/**
 * Verificación manual de flujos críticos (duplicar curso, analytics, etc.)
 * Uso: npx tsx scripts/verify-flows.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
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
  } catch {
    console.warn("No se pudo leer .env.local");
  }
}

loadEnvLocal();

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function main() {
  const results: Array<{ test: string; ok: boolean; detail: string }> = [];

  // --- 1. Seed + duplicar curso ---
  try {
    const seedRes = await fetch(`${BASE}/api/seed`, { method: "POST" });
    const seedData = await seedRes.json();
    if (!seedRes.ok) throw new Error(seedData.error ?? seedRes.statusText);

    const { duplicateCourse, getModules, getLessons } = await import("../src/lib/services/courses");
    const { getQuizzes } = await import("../src/lib/services/quizzes");

    const sourceId = "bautismo";
    const [modsBefore, lessonsBefore, quizzesBefore] = await Promise.all([
      getModules(sourceId),
      getLessons(sourceId),
      getQuizzes(sourceId),
    ]);

    const newId = await duplicateCourse(sourceId);
    const [modsAfter, lessonsAfter, quizzesAfter] = await Promise.all([
      getModules(newId),
      getLessons(newId),
      getQuizzes(newId),
    ]);

    const ok =
      modsAfter.length === modsBefore.length &&
      lessonsAfter.length === lessonsBefore.length &&
      quizzesAfter.length === quizzesBefore.length &&
      modsAfter.length > 0 &&
      lessonsAfter.length > 0;

    results.push({
      test: "Duplicar curso (módulos/lecciones/quizzes)",
      ok,
      detail: ok
        ? `OK — ${modsBefore.length} módulos, ${lessonsBefore.length} lecciones, ${quizzesBefore.length} quizzes → copia ${newId}`
        : `FALLO — origen: ${modsBefore.length}/${lessonsBefore.length}/${quizzesBefore.length}, copia: ${modsAfter.length}/${lessonsAfter.length}/${quizzesAfter.length}`,
    });
  } catch (e) {
    results.push({
      test: "Duplicar curso",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  let testUserId: string | null = null;

  // --- 2. Registro + correo bienvenida ---
  try {
    const testEmail = `test-${Date.now()}@mailinator.com`;
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "Test1234!",
        confirmPassword: "Test1234!",
        displayName: "Usuario Prueba",
        phone: "+50370000000",
      }),
    });
    const regData = await regRes.json();
    testUserId = regData.uid ?? null;
    const hasResend = Boolean(process.env.RESEND_API_KEY);
    results.push({
      test: "Registro de usuario",
      ok: regRes.ok && !!regData.uid,
      detail: regRes.ok
        ? `OK — uid: ${regData.uid?.slice(0, 8)}… email: ${testEmail}`
        : `FALLO — ${regData.error ?? regRes.status}`,
    });
    results.push({
      test: "Correo de bienvenida (Resend)",
      ok: hasResend,
      detail: hasResend
        ? "RESEND_API_KEY configurada — el correo se intentó enviar al registrar (revisa bandeja del email de prueba)"
        : "OMITIDO — falta RESEND_API_KEY en .env.local / Vercel. El registro funciona pero no envía correo.",
    });
  } catch (e) {
    results.push({
      test: "Registro / correo",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  // --- 3. Dashboard analytics (con pago de prueba aprobado) ---
  try {
    const { initializeApp, cert, getApps } = await import("firebase-admin/app");
    const { getFirestore, FieldValue } = await import("firebase-admin/firestore");

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

    const hadApproved = (await db.collection("payments").where("status", "==", "approved").limit(1).get()).size > 0;

    if (!hadApproved && testUserId) {
      await db.collection("payments").add({
        userId: testUserId,
        courseId: "bautismo",
        amount: 2999,
        currency: "USD",
        status: "approved",
        wompi: { transactionId: `verify-${Date.now()}`, reference: `REF-VERIFY-${Date.now()}` },
        createdAt: FieldValue.serverTimestamp(),
        approvedAt: FieldValue.serverTimestamp(),
      });
    }

    const { getDashboardAnalytics } = await import("../src/lib/services/analytics");
    const analytics = await getDashboardAnalytics(6);
    const ok =
      typeof analytics.students === "number" &&
      typeof analytics.totalRevenue === "number" &&
      analytics.salesByMonth.length === 6 &&
      (hadApproved || analytics.totalRevenue > 0);

    results.push({
      test: "Dashboard analytics",
      ok,
      detail: `${hadApproved ? "Pagos reales existentes" : "Pago de prueba insertado"} — Estudiantes: ${analytics.students} | Vendidos: ${analytics.coursesSold} | Ingresos mes: $${(analytics.monthlyRevenue / 100).toFixed(2)} | Total: $${(analytics.totalRevenue / 100).toFixed(2)} | Certificados: ${analytics.certificates}`,
    });
  } catch (e) {
    results.push({
      test: "Dashboard analytics",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  // --- 4. Certificado (settings + generación admin) ---
  try {
    const { getSettings, saveCertificateSettings } = await import("../src/lib/services/settings");
    const settings = await getSettings();
    const customCert = {
      ...settings?.certificates,
      headerTitle: "Catequesis Online — Prueba",
      titleText: "Certificado de Participación",
      bodyText: "Se certifica que",
      borderColor: "#2d4a7a",
      signatureName: "Director de Prueba",
      signatureTitle: "Catequesis Online",
      templateFooter: "Documento de prueba — validación QA",
    };
    await saveCertificateSettings(customCert, "verify-script");

    const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
    const db = getFirestore();

    if (testUserId) {
      const enrollmentId = `${testUserId}_bautismo`;
      await db.collection("enrollments").doc(enrollmentId).set(
        {
          userId: testUserId,
          courseId: "bautismo",
          status: "completed",
          progress: { percentComplete: 100, finalExamPassed: true, lessonsCompleted: 20 },
          enrolledAt: FieldValue.serverTimestamp(),
          completedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    const adminSnap = await db.collection("users").where("role", "==", "admin").limit(1).get();
    if (adminSnap.empty || !testUserId) {
      results.push({
        test: "Certificado de prueba",
        ok: false,
        detail: "Config guardada OK. Falta usuario admin o estudiante de prueba para generar PDF.",
      });
    } else {
      const admin = adminSnap.docs[0].data();
      const { createSessionToken, getSessionCookieName } = await import("../src/lib/auth/session");
      const token = await createSessionToken({
        uid: adminSnap.docs[0].id,
        email: admin.email,
        displayName: admin.displayName,
        role: "admin",
        status: admin.status ?? "active",
      });

      const genRes = await fetch(`${BASE}/api/certificates/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${getSessionCookieName()}=${token}`,
        },
        body: JSON.stringify({ userId: testUserId, courseId: "bautismo" }),
      });
      const genText = await genRes.text();
      let genData: { certificateNumber?: string; error?: string } = {};
      try {
        genData = JSON.parse(genText);
      } catch {
        genData = { error: genText.slice(0, 200) || `HTTP ${genRes.status}` };
      }

      const saved = await getSettings();
      const configOk =
        saved?.certificates?.headerTitle === customCert.headerTitle &&
        saved?.certificates?.signatureName === customCert.signatureName;

      results.push({
        test: "Personalizar certificado (config)",
        ok: configOk,
        detail: configOk
          ? `OK — título: "${saved?.certificates?.headerTitle}", firma: "${saved?.certificates?.signatureName}"`
          : "FALLO — la configuración no persistió correctamente",
      });
      results.push({
        test: "Generar certificado de prueba (PDF)",
        ok: genRes.ok,
        detail: genRes.ok
          ? `OK — ${genData.certificateNumber} (preview en /admin/configuracion → Certificados)`
          : `FALLO — ${genData.error ?? genRes.status}`,
      });
    }
  } catch (e) {
    results.push({
      test: "Certificado",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  console.log("\n=== RESULTADOS DE VERIFICACIÓN ===\n");
  for (const r of results) {
    console.log(`${r.ok ? "✓" : "✗"} ${r.test}`);
    console.log(`  ${r.detail}\n`);
  }

  const failed = results.filter((r) => !r.ok && !r.detail.includes("OMITIDO"));
  process.exit(failed.length > 0 ? 1 : 0);
}

main();
