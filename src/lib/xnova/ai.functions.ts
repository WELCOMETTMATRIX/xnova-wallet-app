import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { chatWithAi } from "./ai.server";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(24),
});

export const askXnovaAi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    try {
      return { ok: true as const, reply: await chatWithAi(data.messages) };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "AI request failed",
      };
    }
  });
