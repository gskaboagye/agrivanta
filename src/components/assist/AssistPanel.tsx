"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  LoaderCircle,
  MessageSquare,
  MessageSquarePlus,
  Send,
  Trash2,
  X,
} from "lucide-react";

type AssistMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type ConversationSummary = {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

type ConversationResponse = {
  conversation: {
    _id: string;
    title: string;
    messages: AssistMessage[];
  };
};

export default function AssistPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/assist/conversations", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load conversation history.");
      }

      const data = await response.json();
      setConversations(Array.isArray(data.conversations) ? data.conversations : []);
    } catch (err) {
      console.error("Assist history error:", err);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setHistoryLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/assist/conversations/${encodeURIComponent(id)}`,
        {
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to open conversation.");
      }

      const result = data as ConversationResponse;

      setMessages(result.conversation.messages || []);
      setActiveConversationId(id);
      setHistoryOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open conversation.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadConversations();
      inputRef.current?.focus();
    }
  }, [open, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function startNewConversation() {
    if (loading) return;

    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    setError("");
    setHistoryOpen(false);
    inputRef.current?.focus();
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) return;

    setInput("");
    setError("");
    setLoading(true);

    const temporaryMessage: AssistMessage = {
      role: "user",
      content: message,
    };

    setMessages((previous) => [...previous, temporaryMessage]);

    try {
      const response = await fetch("/api/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          message,
          ...(activeConversationId
            ? { conversationId: activeConversationId }
            : {}),
        }),
      });

      const data = await response.json();

      if (data.conversationId) {
        setActiveConversationId(data.conversationId);
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to send your message.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);

      void loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function deleteConversation(id: string) {
    if (loading) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this conversation?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/assist/conversations/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete conversation.");
      }

      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }

      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete conversation.");
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open AgriVanta Assist"
          className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-[#17472D] text-white shadow-xl transition hover:scale-105 hover:bg-[#103921] focus:outline-none focus:ring-4 focus:ring-[#17472D]/20"
        >
          <Bot size={26} />
        </button>
      )}

      {open && (
        <section
          aria-label="AgriVanta Assist chat"
          className="fixed bottom-4 right-4 z-[90] flex h-[min(680px,calc(100dvh-32px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-[#DDE5DA] bg-white shadow-2xl"
        >
          <header className="flex items-center justify-between bg-[#17472D] px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Bot size={23} />
              </span>
              <div>
                <h2 className="text-base font-bold">AgriVanta Assist</h2>
                <p className="text-xs text-white/75">
                  Your platform assistant
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Assist"
              className="rounded-lg p-2 transition hover:bg-white/15"
            >
              <X size={20} />
            </button>
          </header>

          <div className="flex items-center justify-between border-b border-[#E8EDE5] px-4 py-3">
            <button
              type="button"
              onClick={() => setHistoryOpen((previous) => !previous)}
              className="flex items-center gap-2 text-sm font-semibold text-[#405342] hover:text-[#17472D]"
            >
              <MessageSquare size={17} />
              Conversations
              <ChevronDown
                size={15}
                className={historyOpen ? "rotate-180 transition" : "transition"}
              />
            </button>

            <button
              type="button"
              onClick={startNewConversation}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[#EDF4EC] px-3 py-2 text-xs font-bold text-[#17472D] transition hover:bg-[#DFEBDD] disabled:opacity-50"
            >
              <MessageSquarePlus size={15} />
              New chat
            </button>
          </div>

          {historyOpen && (
            <div className="max-h-52 overflow-y-auto border-b border-[#E8EDE5] bg-[#FAFCF9] p-2">
              {conversations.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-[#788579]">
                  No previous conversations.
                </p>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                      activeConversationId === conversation.id
                        ? "bg-[#EAF2E8]"
                        : "hover:bg-[#F0F4EE]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => void loadConversation(conversation.id)}
                      className="min-w-0 flex-1 truncate text-left text-xs font-medium text-[#405342]"
                    >
                      {conversation.title}
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteConversation(conversation.id)}
                      aria-label="Delete conversation"
                      className="shrink-0 rounded-md p-1.5 text-[#89948A] hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto bg-[#FAFCF9] p-4">
            {historyLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-[#748174]">
                <LoaderCircle size={18} className="mr-2 animate-spin" />
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E9F2E7] text-[#17472D]">
                  <Bot size={30} />
                </span>
                <h3 className="text-lg font-bold text-[#24442D]">
                  How can I help you?
                </h3>
                <p className="mt-2 max-w-[280px] text-sm leading-6 text-[#718071]">
                  Ask me how to use AgriVanta, manage your account, explore the
                  marketplace, or find the right platform features.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${index}-${message.role}`}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "rounded-br-md bg-[#17472D] text-white"
                        : "rounded-bl-md border border-[#E5EBE2] bg-white text-[#344536] shadow-sm"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-[#E5EBE2] bg-white px-4 py-3 text-xs text-[#738173]">
                  <LoaderCircle size={15} className="animate-spin" />
                  Assist is thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div
              role="alert"
              className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={sendMessage}
            className="border-t border-[#E5EBE2] bg-white p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-[#DCE5D9] bg-[#FAFCF9] p-2 focus-within:border-[#17472D] focus-within:ring-2 focus-within:ring-[#17472D]/10">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Ask AgriVanta Assist..."
                rows={1}
                maxLength={10000}
                disabled={loading}
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[#263B2B] outline-none placeholder:text-[#98A397] disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#17472D] text-white transition hover:bg-[#103921] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Send size={17} />
                )}
              </button>
            </div>

            <p className="mt-2 text-center text-[10px] text-[#98A397]">
              AgriVanta Assist helps you navigate the platform.
            </p>
          </form>
        </section>
      )}
    </>
  );
}