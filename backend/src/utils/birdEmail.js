const { BirdClient } = require('@messagebird/sdk');

let birdClient = null;

function getBirdApiKey() {
  const candidates = [
    process.env.BIRD_API_KEY,
    process.env.MESSAGEBIRD_API_KEY,
    process.env.BIRD_EMAIL_API_KEY,
  ];

  for (const value of candidates) {
    if (!value) continue;
    const cleaned = String(value).trim();
    if (cleaned) return cleaned;
  }

  return '';
}

function getBirdClient() {
  if (birdClient) return birdClient;

  const apiKey = getBirdApiKey();
  if (!apiKey) {
    throw new Error(
      'Bird API key is not configured. Set BIRD_API_KEY (or MESSAGEBIRD_API_KEY) in your backend environment before sending emails.'
    );
  }

  birdClient = new BirdClient({ apiKey });
  return birdClient;
}

async function sendBirdEmail({
  to,
  subject,
  html,
  text,
  fromEmail = process.env.BIRD_EMAIL_FROM_EMAIL || 'onboarding@messagebird.dev',
  fromName = process.env.BIRD_EMAIL_FROM_NAME || 'Bird',
}) {
  const client = getBirdClient();
  const recipients = Array.isArray(to) ? to : [to];

  const payload = {
    from: { email: fromEmail, name: fromName },
    to: recipients,
    subject,
    html,
  };

  if (text) {
    payload.text = text;
  }

  try {
    return await client.email.send(payload);
  } catch (error) {
    const detail = error?.response?.data || error?.message || error;
    console.error('[bird-email] send failed:', detail);
    throw new Error(
      'Bird email send failed. Check the API key, sender address, and Vercel/hosting environment variables.'
    );
  }
}

module.exports = { getBirdApiKey, getBirdClient, sendBirdEmail };
