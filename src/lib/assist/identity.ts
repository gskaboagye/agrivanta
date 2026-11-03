import "server-only";

import { getCurrentUser, type AuthUser } from "@/lib/auth";
import { getOrCreateVisitorSession } from "@/lib/assist/visitor-session";

export type AssistIdentity =
  | {
      type: "user";
      userId: string;
      user: AuthUser;
    }
  | {
      type: "visitor";
      visitorId: string;
      user: null;
    };

export async function getAssistIdentity(): Promise<AssistIdentity> {
  const user = await getCurrentUser();

  if (user) {
    return {
      type: "user",
      userId: user.id,
      user,
    };
  }

  const visitorId = await getOrCreateVisitorSession();

  return {
    type: "visitor",
    visitorId,
    user: null,
  };
}