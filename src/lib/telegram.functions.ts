import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  minutes: z.number().int().min(1).max(600),
  chatId: z.string().trim().min(1).max(64).optional(),
  token: z.string().trim().min(10).max(200).optional(),
});

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

export const sendDelayAlert = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const chatId = data.chatId || "1419099842";
    const text = `⚠️ FluxRoute Alert: Shipment delayed by ${data.minutes} mins due to heavy traffic. Live tracking link: https://eco-dispatch-ai.lovable.app`;

    const lovableKey = process.env["LOVABLE_API_KEY"];
    const telegramKey = process.env["TELEGRAM_API_KEY"];
    const rawToken = (data.token || process.env["TELEGRAM_BOT_TOKEN"] || "").trim();

    try {
      let res: Response;
      if (lovableKey && telegramKey) {
        // Preferred: Lovable-managed Telegram connection via the connector gateway.
        res = await fetch(`${GATEWAY_URL}/sendMessage`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": telegramKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ chat_id: chatId, text }),
        });
      } else if (rawToken) {
        res = await fetch(`https://api.telegram.org/bot${rawToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text }),
        });
      } else {
        return { ok: true as const, simulated: true as const, note: "no credentials" };
      }

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
