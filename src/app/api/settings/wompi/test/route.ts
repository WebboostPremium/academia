import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";
import { ROLES } from "@/lib/constants/roles";
import { FieldValue } from "firebase-admin/firestore";
import { testWompiConnection, getWompiClientId, getWompiClientSecret } from "@/lib/server/wompi";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || session.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!getWompiClientId() || !getWompiClientSecret()) {
    return NextResponse.json(
      { error: "WOMPI_CLIENT_ID y WOMPI_CLIENT_SECRET no configurados en el servidor" },
      { status: 503 }
    );
  }

  try {
    await testWompiConnection();
    const status = "connected" as const;

    await getAdminDb().collection("settings").doc("global").set(
      {
        wompi: {
          publicKey: getWompiClientId(),
          connectionStatus: status,
          lastVerifiedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: session.uid,
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, connectionStatus: status });
  } catch (err) {
    await getAdminDb().collection("settings").doc("global").set(
      {
        wompi: { connectionStatus: "error", lastVerifiedAt: FieldValue.serverTimestamp() },
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: session.uid,
      },
      { merge: true }
    );
    const message = err instanceof Error ? err.message : "Error al conectar con Wompi";
    return NextResponse.json({ error: message, connectionStatus: "error" }, { status: 502 });
  }
}
