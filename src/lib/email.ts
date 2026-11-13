import { Resend } from "resend";



type ReportResponseEmail = {
  to: string;
  userName: string;
  referenceNumber: string;
  responseMessage: string;
};

export async function sendReportResponseEmail({
  to,
  userName,
  referenceNumber,
  responseMessage,
}: ReportResponseEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.error("Email configuration is missing.");
    return { success: false, error: "Email service is not configured." };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: `AgriVanta has responded to your report (${referenceNumber})`,
      text: [
        `Hello ${userName},`,
        "",
        "Our team has reviewed your report and sent you an official response.",
        "",
        `Report reference: ${referenceNumber}`,
        "",
        "Administrator's response:",
        responseMessage,
        "",
        "Please log in to your AgriVanta account to view your report and any further updates.",
        "",
        "Regards,",
        "AgriVanta Support Team",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #26352b; line-height: 1.6;">
          <div style="background: #17472D; padding: 24px; color: white;">
            <h2 style="margin: 0;">AgriVanta</h2>
            <p style="margin: 6px 0 0;">Agriculture Connected</p>
          </div>

          <div style="padding: 24px; border: 1px solid #e5e7eb;">
            <h2>Hello ${escapeHtml(userName)},</h2>
            <p>Our team has reviewed your report and sent you an official response.</p>

            <p><strong>Report reference:</strong> ${escapeHtml(referenceNumber)}</p>

            <div style="background: #f8f6ee; border-left: 4px solid #17472D; padding: 16px; margin: 20px 0;">
              <strong>Administrator's response</strong>
              <p style="white-space: pre-wrap;">${escapeHtml(responseMessage)}</p>
            </div>

            <p>Please log in to your AgriVanta account to view your report and any further updates.</p>

            <p>Regards,<br /><strong>AgriVanta Support Team</strong></p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend email error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Failed to send report response email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown email error.",
    };
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}