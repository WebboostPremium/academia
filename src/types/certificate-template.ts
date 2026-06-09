export interface CertificateTemplate {
  id: string;
  name: string;
  active: boolean;
  headerTitle?: string;
  subtitle?: string;
  titleText?: string;
  bodyText?: string;
  borderColor?: string;
  backgroundImageUrl?: string;
  fontFamily?: string;
  showLogo?: boolean;
  signatureUrl?: string;
  signatureName?: string;
  signatureTitle?: string;
  templateFooter?: string;
}
