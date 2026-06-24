import { authenticator } from "otplib";
import QRCode from "qrcode";

authenticator.options = { window: 1, step: 30 };

const ISSUER = "UoN Event Hub";

export function generateSecret() {
  return authenticator.generateSecret();
}

export function verifyToken(token: string, secret: string) {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

export async function makeQrDataUrl(email: string, secret: string) {
  const uri = authenticator.keyuri(email, ISSUER, secret);
  return QRCode.toDataURL(uri, { width: 220, margin: 1 });
}

export function otpAuthUri(email: string, secret: string) {
  return authenticator.keyuri(email, ISSUER, secret);
}
