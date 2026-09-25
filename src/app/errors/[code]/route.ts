import { cookies } from "next/headers";

const pages: Record<number, { title: string; description: string }> = {
  400: {
    title: "That request didn’t make sense.",
    description: "Check the information and try sending your request again.",
  },
  401: {
    title: "Please sign in first.",
    description: "You need to be signed in to continue to this page.",
  },
  403: {
    title: "This area is private.",
    description: "Your account doesn’t have permission to view this page.",
  },
  404: {
    title: "This page wandered off.",
    description: "The link may be out of date, or the page may have moved.",
  },
  408: {
    title: "That took too long.",
    description: "The request timed out before it could finish. Please try again.",
  },
  409: {
    title: "There’s a conflict.",
    description: "The information changed while you were working. Refresh and try again.",
  },
  429: {
    title: "Let’s take a short pause.",
    description: "Too many requests arrived at once. Wait a moment, then try again.",
  },
  500: {
    title: "We hit a snag.",
    description: "Something went wrong on our side. Please try again in a moment.",
  },
  502: {
    title: "A service is taking a break.",
    description: "We couldn’t get a response from one of our services.",
  },
  503: {
    title: "We’ll be right back.",
    description: "This service is temporarily unavailable. Please try again soon.",
  },
  504: {
    title: "The service took too long.",
    description: "We didn’t get a response in time. Please try again.",
  },
};

export async function GET(_request: Request, context: RouteContext<"/errors/[code]">) {
  const { code: rawCode } = await context.params;
  const status = Number(rawCode);
  const page = pages[status];
  if (!page) return new Response("Not found", { status: 404 });

  const theme = (await cookies()).get("matefor-theme")?.value === "dark" ? "dark" : "light";
  const html = `<!doctype html><html lang="en" class="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="${theme === "dark" ? "#17171b" : "#fcf8f6"}"><title>${status} · matefor.</title><style>
    :root{color-scheme:light;--bg:#fcf8f6;--fg:#20212a;--muted:#716b68;--line:#e5deda;--surface:#fff;--primary:#d63d47}.dark{color-scheme:dark;--bg:#17171b;--fg:#f6f0ed;--muted:#b8aeab;--line:#403b3d;--surface:#222126;--primary:#ed6870}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:var(--bg);color:var(--fg);font:16px/1.65 Arial,sans-serif;display:grid;place-items:center;padding:28px}.wrap{width:min(100%,640px)}.brand{display:flex;align-items:center;gap:10px;font-weight:800;text-decoration:none;color:var(--fg)}.mark{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:#ed6870;color:#fff;font-size:20px}.code{margin:72px 0 4px;color:var(--primary);font-size:14px;font-weight:800;letter-spacing:.18em}.eyebrow{margin:0;color:var(--muted);font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.12em}h1{max-width:540px;margin:10px 0;font-family:Georgia,serif;font-size:clamp(38px,8vw,64px);line-height:1.05;letter-spacing:-.04em}.desc{max-width:480px;margin:16px 0 26px;color:var(--muted)}.action{display:inline-flex;align-items:center;gap:12px;padding:13px 20px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--fg);font-weight:700;text-decoration:none}.action:hover{border-color:var(--primary)}
    </style></head><body><main class="wrap"><a class="brand" href="/"><span class="mark">m</span>matefor.</a><p class="code">${status}</p><p class="eyebrow">A little detour</p><h1>${page.title}</h1><p class="desc">${page.description}</p><a class="action" href="/">Back to home <span aria-hidden="true">→</span></a></main></body></html>`;

  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
