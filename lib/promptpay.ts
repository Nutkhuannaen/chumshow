import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

/**
 * Builds the Thai QR Payment (EMVCo Merchant-Presented Mode) payload for a PromptPay ID
 * and renders it as a scannable PNG data URL. No bank API / merchant account needed —
 * any Thai banking app can read this offline. There is no automatic payment confirmation;
 * see the POS receipt flow for the manual "confirm received" step.
 */
export async function generatePromptPayQrDataUrl(promptPayId: string, amount: number): Promise<string> {
  const payload = generatePayload(promptPayId, { amount });
  return QRCode.toDataURL(payload, { margin: 1, width: 320 });
}
