export interface InstitutionSettings {
  name: string;
  logoUrl: string;
  faviconUrl?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  social: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
}

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface WompiSettings {
  publicKey: string;
  environment: "sandbox" | "production";
  connectionStatus: "connected" | "disconnected" | "error";
  lastVerifiedAt?: Date;
}

export interface AppSettings {
  institution: InstitutionSettings;
  branding: BrandingSettings;
  wompi: WompiSettings;
  certificates: {
    headerTitle?: string;
    titleText?: string;
    bodyText?: string;
    borderColor?: string;
    showLogo?: boolean;
    signatureUrl?: string;
    signatureName?: string;
    signatureTitle?: string;
    templateFooter?: string;
  };
  email: {
    fromName: string;
    fromEmail: string;
    welcomeEnabled?: boolean;
    purchaseEnabled?: boolean;
    certificateEnabled?: boolean;
    reminderEnabled?: boolean;
  };
  general: {
    maintenanceMode?: boolean;
    allowRegistration?: boolean;
    promoBanner?: string;
  };
  updatedAt: Date;
  updatedBy: string;
}
