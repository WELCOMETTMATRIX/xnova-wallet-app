import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Loader2, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import bgVideo from "@/assets/xnova-chat-bg.mp4.asset.json";
import { askXnovaAi } from "@/lib/xnova/ai.functions";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What is XNOVA?",
  "How do the whale alerts work?",
  "Which wallets can I connect?",
  "Explain the holder intelligence panel",
];

export function AiChat() {
  const ask = useServerFn(askXnovaAi);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "XNOVA AI online. Ask about the token, the terminal panels, wallet connectivity, alerts or Solana in general. Live numbers stay in the market panels — I never invent them.",
    },
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: async (next: Msg[]) => ask({ data: { messages: next } }),
    onSuccess: (res) => {
      if (res.ok) {
        setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
      } else {
        setError(res.error);
      }
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Request failed"),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, mutation.isPending]);

  function send(text: string) {
    const content = text.trim();
    if (!content || mutation.isPending) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user" as const, content }].slice(-24);
    setMessages(next);
    setInput("");
    mutation.mutate(next.filter((m) => m.role === "user" || m.role === "assistant"));
  }

  return (
    <section className="panel relative overflow-hidden">
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
        src={bgVideo.url}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background/80"
        aria-hidden
      />

      <div className="relative flex h-[70vh] min-h-[520px] flex-col">
        <header className="flex items-center justify-between border-b border-border/80 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Bot className="size-4 text-primary" aria-hidden />
            <span className="num text-[11px] uppercase tracking-widest">XNOVA AI TERMINAL</span>
          </div>
          <span className="label-xs">Non-custodial · Not financial advice</span>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "assistant" ? (
                <Bot className="mt-1 size-3.5 shrink-0 text-primary" aria-hidden />
              ) : null}
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-sm border px-3 py-2 text-[13px] leading-relaxed backdrop-blur",
                  m.role === "user"
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-surface/70 text-muted-foreground",
                )}
              >
                {m.content}
              </div>
              {m.role === "user" ? (
                <User className="mt-1 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              ) : null}
            </div>
          ))}
          {mutation.isPending ? (
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden /> Thinking
            </div>
          ) : null}
          {error ? <p className="text-[11px] text-warn">{error}</p> : null}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border/80 px-4 py-3 backdrop-blur">
          <div className="mb-2 flex flex-wrap gap-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="num rounded-sm border border-border px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 rounded-sm border border-border bg-background/80 px-3 py-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask XNOVA AI…"
              aria-label="Message XNOVA AI"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={mutation.isPending || !input.trim()}
              className="num inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-[11px] uppercase tracking-widest text-primary-foreground disabled:opacity-40"
            >
              Send <Send className="size-3" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
