import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WEBHOOK_SECRET = process.env.DUEMINT_WEBHOOK_SECRET;

// Rate limiting: max requests per IP within the window
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute per IP

const ipRequestLog = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestLog.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestLog.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * POST /api/webhooks/duemint
 *
 * Receives webhook events from Duemint when invoices are created or updated.
 * Security:
 *   - X-Webhook-Secret header must match DUEMINT_WEBHOOK_SECRET env var
 *   - Rate limited to 60 requests/minute per IP
 *   - Payload logged to WebhookLog table for debugging
 *
 * While we're mapping the payload structure, this endpoint logs everything
 * and returns 200 to acknowledge receipt.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // Rate limit
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // Validate webhook secret
  if (!WEBHOOK_SECRET) {
    console.error("[webhook/duemint] DUEMINT_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const secret = request.headers.get("x-webhook-secret");
  if (!secret || secret !== WEBHOOK_SECRET) {
    console.warn(`[webhook/duemint] Invalid secret from ${ip}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Log the webhook for analysis
  const eventType = extractEventType(payload);

  try {
    await prisma.webhookLog.create({
      data: {
        source: "duemint",
        eventType,
        payload: JSON.stringify(payload),
        ip,
        headers: JSON.stringify(sanitizeHeaders(request.headers)),
      },
    });
  } catch (err) {
    console.error("[webhook/duemint] Failed to log webhook:", err);
  }

  console.log(`[webhook/duemint] Received event="${eventType}" from ${ip}`);

  // TODO: Process the webhook payload once we know the structure
  // For now, just acknowledge receipt

  return NextResponse.json({ received: true, event: eventType });
}

// Try to extract an event type from the payload (best guess until we see real data)
function extractEventType(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) return "unknown";
  const obj = payload as Record<string, unknown>;
  if (typeof obj.event === "string") return obj.event;
  if (typeof obj.type === "string") return obj.type;
  if (typeof obj.action === "string") return obj.action;
  return "unknown";
}

// Strip sensitive headers, keep useful ones for debugging
function sanitizeHeaders(headers: Headers): Record<string, string> {
  const safe: Record<string, string> = {};
  const keep = ["content-type", "user-agent", "x-forwarded-for", "x-real-ip", "x-webhook-event"];
  for (const key of keep) {
    const val = headers.get(key);
    if (val) safe[key] = val;
  }
  return safe;
}
