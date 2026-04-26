/**
 * Fast2SMS — Mock
 *
 * Production endpoint:
 *   POST https://www.fast2sms.com/dev/bulkV2
 *   Headers: { "authorization": FAST2SMS_API_KEY }
 *   Body:    { "route": "q", "message": ..., "numbers": "..." }
 */

export interface SmsResult {
  ok: boolean;
  messageId: string;
  sentAt: string;
}

export async function sendReferralSMS(toNumber: string, message: string): Promise<SmsResult> {
  // Simulate network round-trip
  await new Promise((r) => setTimeout(r, 600));
  return {
    ok: true,
    messageId: "MOCK-" + Date.now().toString(36).toUpperCase(),
    sentAt: new Date().toISOString(),
  };
}
