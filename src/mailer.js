import axios from "axios";

export const sendMail = async ({ from, to, bcc, subject, html, text, replyTo }) => {
  const params = new URLSearchParams();

  params.append("from", from);
  if (to) params.append("to", to);
  params.append("subject", subject);
  if (html) params.append("html", html);
  if (text) params.append("text", text);
  if (bcc) {
    if (Array.isArray(bcc)) bcc.forEach((addr) => params.append("bcc", addr));
    else params.append("bcc", bcc);
  }
  if (replyTo) params.append("h:Reply-To", replyTo);

  const response = await axios.post(
    `${process.env.MAILGUN_BASE_URL}/v3/${process.env.MAILGUN_DOMAIN}/messages`,
    params,
    { auth: { username: "api", password: process.env.MAILGUN_API_KEY } }
  );

  return { messageId: response.data.id };
};
