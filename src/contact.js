import nodemailer from "nodemailer";

export const runContactSubmit = async (inputParams) => {
  if (!inputParams) return { success: false, message: "No input parameters" };

  const { name, email, subject, message } = inputParams;

  const mailParams = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_RECIPIENT,
    subject: `CONTACT FORM SUBMISSION: ${subject}`,
    html: `
      <h3>NEW CONTACT FORM SUBMISSION</h3><br><br>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject || "No subject provided"}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>} `,

    replyTo: email,
  };

  const transport = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    const data = await transport.sendMail(mailParams);
    console.log("EMAIL SENT:", data.response);
    return { success: true, message: "Email sent successfully", messageId: data.messageId };
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    return { success: false, message: "Failed to send email" };
  }
};
