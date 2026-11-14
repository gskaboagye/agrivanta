
type SendSmsInput = {
  recipient: string;
  message: string;
};

type ArkeselResponse = {
  status?: string;
  message?: string;
  data?: unknown;
};

type SendSmsResult = {
  success: boolean;
  message: string;
  data?: unknown;
};

const ARKESEL_API_URL = "https://sms.arkesel.com/api/v2/sms/send";

export async function sendSms({
  recipient,
  message,
}: SendSmsInput): Promise<SendSmsResult> {
  const apiKey = process.env.ARKESEL_API_KEY;
  const senderId = process.env.ARKESEL_SENDER_ID;

  // SMS remains disabled until explicitly enabled.
  if (process.env.ARKESEL_SMS_ENABLED !== "true") {
    return {
      success: false,
      message: "SMS sending is currently disabled.",
    };
  }

  if (!apiKey) {
    return {
      success: false,
      message: "Arkesel API key is not configured.",
    };
  }

  if (!senderId) {
    return {
      success: false,
      message: "Arkesel sender ID is not configured.",
    };
  }

  const normalizedRecipient = recipient.replace(/[\s()-]/g, "");

  // Ghanaian phone numbers must use international format.
  if (!/^\+233\d{9}$/.test(normalizedRecipient)) {
    return {
      success: false,
      message: "Invalid recipient phone number. Use +233XXXXXXXXX.",
    };
  }

  const trimmedMessage = message.trim();

  if (!trimmedMessage || trimmedMessage.length > 1000) {
    return {
      success: false,
      message: "Message must contain between 1 and 1000 characters.",
    };
  }

  try {
    const response = await fetch(ARKESEL_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: senderId,
        message: trimmedMessage,
        recipients: [normalizedRecipient],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const result = (await response.json()) as ArkeselResponse;

    if (!response.ok || result.status !== "success") {
      console.error("Arkesel SMS request failed:", {
        status: response.status,
        message: result.message,
      });

      return {
        success: false,
        message: result.message || "Arkesel could not send the SMS.",
      };
    }

    return {
      success: true,
      message: "SMS request accepted by Arkesel.",
      data: result.data,
    };
  } catch (error) {
    console.error("Arkesel SMS connection error:", error);

    return {
      success: false,
      message: "Unable to connect to the SMS provider.",
    };
  }
}
