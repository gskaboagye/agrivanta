
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

const ARKESEL_API_URL =
  "https://sms.arkesel.com/api/v2/sms/send";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_MESSAGE_LENGTH = 1000;

export async function sendSms({
  recipient,
  message,
}: SendSmsInput): Promise<SendSmsResult> {
  const apiKey = process.env.ARKESEL_API_KEY?.trim();
  const senderId = process.env.ARKESEL_SENDER_ID?.trim();

  // Check whether SMS functionality is enabled.
  if (process.env.ARKESEL_SMS_ENABLED !== "true") {
    return {
      success: false,
      providerAccepted: false,
      message: "SMS sending is currently disabled.",
    };
  }

  // Validate Arkesel configuration.
  if (!apiKey || !senderId) {
    console.error("Arkesel configuration is incomplete.", {
      apiKeyConfigured: Boolean(apiKey),
      senderIdConfigured: Boolean(senderId),
    });

    return {
      success: false,
      providerAccepted: false,
      message: "SMS service is not properly configured.",
    };
  }

  // Normalize and validate the recipient.
  const normalizedRecipient = recipient.replace(/[\s()-]/g, "");

  if (!/^\+233\d{9}$/.test(normalizedRecipient)) {
    return {
      success: false,
      providerAccepted: false,
      message: "Invalid Ghanaian recipient phone number.",
    };
  }

  // Validate SMS message.
  const trimmedMessage = message.trim();

  if (
    !trimmedMessage ||
    trimmedMessage.length > MAX_MESSAGE_LENGTH
  ) {
    return {
      success: false,
      providerAccepted: false,
      message:
        "Message must contain between 1 and 1000 characters.",
    };
  }

  try {
    const response = await fetch(ARKESEL_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: senderId,
        message: trimmedMessage,
        recipients: [normalizedRecipient],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    // Read the response body once.
    const responseText = await response.text();

    let result: ArkeselResponse;

    try {
      result = JSON.parse(responseText) as ArkeselResponse;
    } catch {
      console.error("Arkesel returned an invalid JSON response.", {
        status: response.status,
        responsePreview: responseText.slice(0, 300),
      });

      return {
        success: false,
        providerAccepted: false,
        message: "SMS provider returned an invalid response.",
      };
    }

    // Check both HTTP status and Arkesel's application status.
    if (!response.ok || result.status !== "success") {
      const providerMessage =
        typeof result.message === "string"
          ? result.message.slice(0, 300)
          : "No provider message returned.";

      console.error("Arkesel SMS request was not accepted:", {
        status: response.status,
        providerStatus: result.status ?? "Unknown",
        providerMessage,
      });

      return {
        success: false,
        providerAccepted: false,
        message: "SMS provider could not accept the request.",
      };
    }

    // Arkesel accepted the SMS request.
    console.info("Arkesel accepted SMS request.", {
      recipient: normalizedRecipient,
      senderId,
      status: response.status,
    });

    return {
      success: true,
      providerAccepted: true,
      message: "SMS request accepted by Arkesel.",
    };
  } catch (error) {
    const errorName =
      error instanceof Error ? error.name : "Unknown";

    console.error("Arkesel SMS connection error:", {
      error: errorName,
      message:
        error instanceof Error
          ? error.message.slice(0, 300)
          : "Unknown connection error.",
    });

    return {
      success: false,
      providerAccepted: false,
      message:
        errorName === "TimeoutError" || errorName === "AbortError"
          ? "SMS provider request timed out."
          : "Unable to connect to the SMS provider.",
    };
  }
}
