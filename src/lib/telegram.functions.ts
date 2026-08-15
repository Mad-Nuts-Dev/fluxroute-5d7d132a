import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  minutes: z.number().int().min(1).max(600),
  chatId: z.string().trim().min(1).max(64).optional(),
  token: z.string().trim().min(10).max(200).optional(),
});

export const sendDelayAlert = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const token = (data.token || process.env["TELEGRAM_BOT_TOKEN"] || "").trim();
    const chatId = data.chatId || "1419099842";
    // No bot token configured — behave as a clean simulated dispatch instead of erroring.
    if (!token) {
      return { ok: true as const, simulated: true as const };
    }

    const text = `⚠️ Smart Eco-Fleet Alert: Shipment delayed by ${data.minutes} mins due to heavy traffic. Live tracking link: https://eco-fleet-buddy.lovable.app`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });

      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        description?: string;
      } | null;
      if (!res.ok || !body?.ok) {
        const description = body?.description ?? `HTTP ${res.status}`;
        console.error(`Telegram sendMessage failed [${res.status}]: ${description}`);
        return { ok: true as const, simulated: true as const, note: description };
      }
      return { ok: true as const, simulated: false as const };
    } catch (err) {
      console.error("Telegram sendMessage threw", err);
      return { ok: true as const, simulated: true as const, note: String(err) };
    }
  });
