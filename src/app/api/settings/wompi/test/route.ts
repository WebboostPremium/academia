import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";
import { ROLES } from "@/lib/constants/roles";
import { FieldValue } from "firebase-admin/firestore";

const WOMPI_API = process.env.WOMPI_API_URL ?? "https://api.wompi.sv/v1";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || session.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const wompiPrivateKey = process.env.WOMPI_PRIVATE_KEY;
  if (!wompiPrivateKey) {
    return NextResponse.json({ error: "WOMPI_PRIVATE_KEY no configurada en el servidor" }, { status: 503 });
  }

  try {
    const res = await fetch(`${WOMPI_API}/merchants/me`, {
      headers: { Authorization: `Bearer ${wompiPrivateKey}` },
    });

    const status = res.ok ? "connected" : "error";
    await getAdminDb().collection("settings").doc("global").set(
      {
        wompi: {
          connectionStatus: status,
          lastVerifiedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: session.uid,
      },
      { merge: true }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "No se pudo conectar con Wompi", connectionStatus: status }, { status: 502 });
    }

    return NextResponse.json({ success: true, connectionStatus: status });
  } catch {
    await getAdminDb().collection("settings").doc("global").set(
      {
        wompi: { connectionStatus: "error", lastVerifiedAt: FieldValue.serverTimestamp() },
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: session.uid,
      },
      { merge: true }
    );
    return NextResponse.json({ error: "Error al conectar con Wompi", connectionStatus: "error" }, { status: 502 });
  }
}
