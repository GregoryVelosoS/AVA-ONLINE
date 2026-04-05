import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { signAdminToken } from "@/server/auth/jwt";
import { prisma } from "@/server/db/prisma";
import { loginSchema } from "@/server/validators/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
    }

    const admin = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 });
    }

    const valid = await bcrypt.compare(parsed.data.password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 });
    }

    const token = signAdminToken({
      sub: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    });

    const response = NextResponse.json({
      ok: true,
      role: admin.role,
      redirectTo: admin.role === "VISUALIZADOR" ? "/admin/reports" : "/admin/dashboard"
    });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8
    });

    await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.error("Database unavailable during login", error);
      return NextResponse.json(
        { error: "Banco de dados indisponivel. Verifique a conexao e tente novamente." },
        { status: 503 }
      );
    }

    console.error("Unexpected login error", error);
    return NextResponse.json({ error: "Nao foi possivel concluir o login." }, { status: 500 });
  }
}
