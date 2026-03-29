import { NextRequest, NextResponse } from "next/server";

function decodeTokenRole(token?: string) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded)) as { role?: "ADM" | "VISUALIZADOR" };
    return decoded.role ?? null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("admin_token")?.value;
  const role = decodeTokenRole(token);

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    if (role === "VISUALIZADOR" && !pathname.startsWith("/admin/reports")) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/reports";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/api/admin")) {
    if (!token) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    if (role === "VISUALIZADOR") {
      return NextResponse.json({ error: "Acesso restrito ao perfil ADM." }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
