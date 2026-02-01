import nodemailer from "nodemailer";

export const runContactSubmit = async (inputParams) => {
  if (!inputParams) return { success: false, message: "No input parameters" };

  console.log("RUN CONTACT SUBMIT");
  console.log("INPUT PARAMS");
  console.log(inputParams);

  const { name, email, subject, message } = inputParams;

  const mailParams = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_RECIPIENT,
    subject: `SITE MESSAGE FROM ${name} | SUBJECT: ${subject}`,
    html: `
      <h4>NEW CONTACT FORM SUBMISSION:</h4>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject || "No subject provided"}</p>
      <p><strong>Message:</strong> ${message.replace(/\n/g, "<br>")}</p>`,

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
