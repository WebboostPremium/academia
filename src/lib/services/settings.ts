import { getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { fsDoc } from "@/lib/firebase/firestore-helpers";
import type { AppSettings } from "@/types/settings";

const SETTINGS_DOC = "global";

export const DEFAULT_SETTINGS: Omit<AppSettings, "updatedAt" | "updatedBy"> = {
  institution: {
    name: "Catequesis Online",
    logoUrl: "",
    email: "contacto@catequesis.online",
    social: {},
  },
  branding: {
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af",
    accentColor: "#3b82f6",
  },
  wompi: {
    publicKey: "",
    environment: "sandbox",
    connectionStatus: "disconnected",
  },
  certificates: {},
  email: {
    fromName: "Catequesis Online",
    fromEmail: "noreply@catequesis.online",
  },
};

export async function getSettings(): Promise<AppSettings | null> {
  const snap = await getDoc(fsDoc("settings", SETTINGS_DOC));
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    institution: data.institution,
    branding: data.branding,
    wompi: {
      ...data.wompi,
      lastVerifiedAt: data.wompi?.lastVerifiedAt?.toDate?.(),
    },
    certificates: data.certificates ?? {},
    email: data.email,
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    updatedBy: data.updatedBy ?? "",
  };
}

export async function saveInstitutionSettings(
  institution: AppSettings["institution"],
  updatedBy: string
): Promise<void> {
  await setDoc(
    fsDoc("settings", SETTINGS_DOC),
    {
      institution,
      updatedAt: serverTimestamp(),
      updatedBy,
    },
    { merge: true }
  );
}

export async function saveBrandingSettings(
  branding: AppSettings["branding"],
  updatedBy: string
): Promise<void> {
  await setDoc(
    fsDoc("settings", SETTINGS_DOC),
    { branding, updatedAt: serverTimestamp(), updatedBy },
    { merge: true }
  );
}

export async function saveWompiSettings(
  wompi: AppSettings["wompi"],
  updatedBy: string
): Promise<void> {
  await setDoc(
    fsDoc("settings", SETTINGS_DOC),
    { wompi, updatedAt: serverTimestamp(), updatedBy },
    { merge: true }
  );
}

export async function saveCertificateSettings(
  certificates: AppSettings["certificates"],
  updatedBy: string
): Promise<void> {
  await setDoc(
    fsDoc("settings", SETTINGS_DOC),
    { certificates, updatedAt: serverTimestamp(), updatedBy },
    { merge: true }
  );
}
