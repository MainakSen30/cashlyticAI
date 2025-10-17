import { Resend } from "resend";

export async function sendEmail({ to, subject, react }) {
  const resend = new Resend( process.env.RESEND_API_KEY || "" );
  try {
    const data = await resend.emails.send({
      from: "CashlyticAI <onboarding@resend.dev>",
      to,
      subject,
      react,
    });
  } catch (error) {
    console.error("Failed to send email", error);
    return { success: false, error };
  }
}