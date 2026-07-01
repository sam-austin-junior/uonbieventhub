import { authenticator } from "otplib";
import QRCode from "qrcode";

// window: 2 tolerates ±60 seconds of clock drift between the user's
// authenticator app and the server. Standard for consumer 2FA; Google
// itself typically uses 2-3 windows on the server side. Any smaller and
// legitimate users get rejected when clocks are ~40s apart.
authenticator.options = { window: 2, step: 30 };

const ISSUER = "UoN Event Hub";

export function generateSecret() {
  return authenticator.generateSecret();
}

export function verifyToken(token: string, secret: string) {
  // Strip all whitespace + non-digits defensively. Authenticator apps
  // display codes as "123 456"; users often paste with the space and
  // some browsers autocomplete an extra char.
  const cleaned = String(token ?? "").replace(/\D/g, "");
  if (cleaned.length !== 6) return false;
  try {
    return authenticator.verify({ token: cleaned, secret });
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
