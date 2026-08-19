// Optional SMS notifications via Africa's Talking.
// Disabled unless BOTH the global env flag AND the business's own
// smsEnabled setting are true — so nobody incurs SMS costs by accident.
//
// Sandbox credentials (https://account.africastalking.com) let you test
// for free; production sending costs a small fee per SMS.

let africastalking = null;

function getClient() {
  if (africastalking) return africastalking;
  if (process.env.SMS_ENABLED_GLOBALLY !== 'true') return null;
  if (!process.env.AFRICASTALKING_USERNAME || !process.env.AFRICASTALKING_API_KEY) return null;

  // Lazy require so the dependency is only needed if SMS is actually configured.
  const AfricasTalking = require('africastalking')({
    username: process.env.AFRICASTALKING_USERNAME,
    apiKey: process.env.AFRICASTALKING_API_KEY,
  });
  africastalking = AfricasTalking.SMS;
  return africastalking;
}

/**
 * Sends an SMS if, and only if, the business has opted in.
 * Fails silently (logs a warning) rather than throwing — a failed SMS
 * should never break the queue flow.
 */
async function sendSmsIfEnabled({ business, to, message }) {
  if (!business?.smsEnabled) return { sent: false, reason: 'business_opted_out' };

  const client = getClient();
  if (!client) return { sent: false, reason: 'sms_not_configured' };

  try {
    await client.send({
      to: [to],
      message,
      from: process.env.AFRICASTALKING_SENDER_ID || undefined,
    });
    return { sent: true };
  } catch (err) {
    console.warn('[sms] send failed:', err.message);
    return { sent: false, reason: 'send_error' };
  }
}

module.exports = { sendSmsIfEnabled };
