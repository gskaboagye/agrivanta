import "server-only";

type SendSmsInput = {
  recipient: string;
  message: string;
};

type ArkeselResponse = {
  status?: string;
  message?: string;
  data?: unknown;
};

export type SendSmsResult = {
  success: boolean;
  message: string;
  providerAccepted: boolean;
};

const ARKESEL_API_URL = "https://sms.arkesel.com/api/v2/sms/send";

export async function sendSms({
  recipient,
  message,
}: SendSmsInput): Promise<SendSmsResult> {
  const apiKey = process.env.ARKESEL_API_KEY;
  const senderId = process.env.ARKESEL_SENDER_ID;

  if (process.env.ARKESEL_SMS_ENABLED !== "true") {
    return {
      success: false,
      providerAccepted: false,
      message: "SMS sending is currently disabled.",
    };
  }

  if (!apiKey || !senderId) {
    console.error("Arkesel configuration is incomplete.");

    return {
      success: false,
      providerAccepted: false,
      message: "SMS service is not properly configured.",
    };
  }

  const normalizedRecipient = recipient.replace(/[\s()-]/g, "");

  if (!/^\+233\d{9}$/.test(normalizedRecipient)) {
    return {
      success: false,
      providerAccepted: false,
      message: "Invalid Ghanaian recipient phone number.",
    };
  }

  const trimmedMessage = message.trim();

  if (!trimmedMessage || trimmedMessage.length > 1000) {
    return {
      success: false,
      providerAccepted: false,
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

    let result: ArkeselResponse;

    try {
      result = (await response.json()) as ArkeselResponse;
    } catch {
      console.error("Arkesel returned an invalid response.");

      return {
        success: false,
        providerAccepted: false,
        message: "SMS provider returned an invalid response.",
      };
    }

    if (!response.ok || result.status !== "success") {
      console.error("Arkesel SMS request was not accepted:", {
        status: response.status,
      });

      return {
        success: false,
        providerAccepted: false,
        message: "SMS provider could not accept the request.",
      };
    }

    return {
      success: true,
      providerAccepted: true,
      message: "SMS request accepted by Arkesel.",
    };
  } catch (error) {
    console.error("Arkesel SMS connection error:", {
      error: error instanceof Error ? error.name : "Unknown error",
    });

    return {
      success: false,
      providerAccepted: false,
      message: "Unable to connect to the SMS provider.",
    };
  }
}
