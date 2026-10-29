
"use client";

import {
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  LoaderCircle,
  MessageCircle,
  Send,
} from "lucide-react";

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string | null;
  initial: boolean;
};

type Conversation = {
  id: string;
  listingId: string;
  listingTitle: string;
  participantName: string;
};

function ConversationContent() {
  const params = useParams<{ id: string }>();
  const inquiryId = params.id;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const requestInProgressRef = useRef(false);
  const initialLoadRef = useRef(true);

  const loadConversation = useCallback(async (silent = false) => {
    if (!inquiryId || requestInProgressRef.current) return;

    requestInProgressRef.current = true;

    try {
      const response = await fetch(
        `/api/inquiries/${encodeURIComponent(inquiryId)}/messages`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load conversation.");
      }

      setConversation(data.inquiry);
      setMessages(Array.isArray(data.messages) ? data.messages : []);

      if (typeof data.currentUserId === "string") {
        setCurrentUserId(data.currentUserId);
      }

      setError("");
    } catch (err) {
      if (!silent || initialLoadRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load conversation."
        );
      }
    } finally {
      requestInProgressRef.current = false;
      initialLoadRef.current = false;
      setLoading(false);
    }
  }, [inquiryId]);

  useEffect(() => {
    void loadConversation();

    const intervalId = window.setInterval(() => {
      if (!document.hidden) {
        void loadConversation(true);
      }
    }, 5000);

    function handleVisibilityChange() {
      if (!document.hidden) {
        void loadConversation(true);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [loadConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = draft.trim();

    if (!message || sendingRef.current || message.length > 3000) {
      return;
    }

    sendingRef.current = true;
    setSending(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/inquiries/${encodeURIComponent(inquiryId)}/messages`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        }
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send message.");
      }

      if (data.message) {
        setMessages((current) => {
          const alreadyExists = current.some(
            (item) => item.id === data.message.id
          );

          if (alreadyExists) return current;

          return [...current, data.message];
        });
      }

      setDraft("");
      setNotice("Message sent.");

      // Refresh the conversation to ensure the server remains the source of truth.
      await loadConversation(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to send message."
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F6EE] px-4 py-8 text-[#203B2A] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard/messages"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#52705A] hover:text-[#17472D]"
        >
          <ArrowLeft size={17} />
          All messages
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E0E5D9] bg-white">
          <header className="border-b border-[#E0E5D9] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]">
                <MessageCircle size={21} />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold">
                  {conversation?.participantName ?? "Conversation"}
                </h1>

                <p className="mt-1 text-sm text-[#68776A]">
                  {conversation?.listingTitle ?? "Loading listing..."}
                </p>
              </div>
            </div>

            {conversation?.listingId && (
              <Link
                href={`/products?listing=${encodeURIComponent(
                  conversation.listingId
                )}`}
                className="mt-4 inline-block text-sm font-semibold text-[#17472D] underline underline-offset-4"
              >
                View listing
              </Link>
            )}
          </header>

          {error && (
            <div
              role="alert"
              className="m-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="m-4 rounded-xl bg-[#EDF5E9] p-3 text-sm text-[#24542E]"
            >
              {notice}
            </div>
          )}

          <section
            aria-label="Conversation messages"
            aria-live="polite"
            className="flex min-h-72 flex-col gap-4 bg-[#FBFCF9] p-4 sm:p-6"
          >
            {loading ? (
              <div className="flex flex-1 items-center justify-center gap-3 text-sm text-[#68776A]">
                <LoaderCircle size={20} className="animate-spin" />
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#68776A]">
                No messages in this conversation yet.
              </p>
            ) : (
              messages.map((message) => {
                const isOwnMessage =
                  currentUserId !== null &&
                  message.senderId === currentUserId;

                return (
                  <article
                    key={message.id}
                    className={`max-w-[90%] rounded-2xl border p-4 sm:max-w-[75%] ${
                      isOwnMessage
                        ? "self-end border-[#17472D] bg-[#17472D] text-white"
                        : "self-start border-[#E0E5D9] bg-white text-[#435746]"
                    }`}
                  >
                    <p
                      className={`text-xs font-bold ${
                        isOwnMessage ? "text-[#E4F0DE]" : "text-[#17472D]"
                      }`}
                    >
                      {isOwnMessage ? "You" : message.senderName}
                    </p>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                      {message.body}
                    </p>

                    <p
                      className={`mt-2 text-[10px] ${
                        isOwnMessage ? "text-[#D2E2D0]" : "text-[#879084]"
                      }`}
                    >
                      {message.createdAt
                        ? new Date(message.createdAt).toLocaleString(
                            "en-GH",
                            {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }
                          )
                        : ""}
                    </p>
                  </article>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </section>

          <form
            onSubmit={sendMessage}
            className="border-t border-[#E0E5D9] p-4 sm:p-5"
          >
            <label
              htmlFor="message"
              className="mb-2 block text-sm font-semibold"
            >
              Your message
            </label>

            <textarea
              id="message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={3000}
              rows={3}
              required
              placeholder="Write your message..."
              className="w-full resize-y rounded-xl border border-[#D9E1D5] bg-white p-3 text-sm outline-none focus:border-[#17472D]"
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-[#879084]">
                {draft.length}/3000 characters
              </span>

              <button
                type="submit"
                disabled={
                  sending || loading || !draft.trim() || draft.trim().length > 3000
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#17472D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#235C3B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {sending ? "Sending..." : "Send message"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ConversationPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-4xl p-6 text-[#203B2A]">
          <p className="text-sm text-[#68776A]">
            Loading conversation...
          </p>
        </main>
      }
    >
      <ConversationContent />
    </Suspense>
  );
}
