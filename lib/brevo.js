const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = "team@learnfromola.online";
const SENDER_NAME = "Learn From Ola";

if (!BREVO_API_KEY) {
  console.warn("BREVO_API_KEY is not configured. Transactional emails will not send.");
}

export async function sendBrevoEmail({ toEmail, toName, subject, htmlContent, textContent }) {
  if (!BREVO_API_KEY) {
    return { error: "BREVO_API_KEY not configured" };
  }

  const payload = {
    sender: { email: SENDER_EMAIL, name: SENDER_NAME },
    to: [{ email: toEmail, name: toName || "" }],
    subject,
    textContent,
    htmlContent,
  };

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || `Brevo API error: ${response.status}` };
    }

    const result = await response.json();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}
