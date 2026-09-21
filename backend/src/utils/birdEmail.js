const { BirdClient } = require('@messagebird/sdk');

let birdClient = null;

function getBirdClient() {
  if (birdClient) return birdClient;

  const apiKey = process.env.BIRD_API_KEY;
  if (!apiKey) {
    throw new Error('BIRD_API_KEY is not configured.');
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

  return client.email.send(payload);
}

module.exports = { getBirdClient, sendBirdEmail };
