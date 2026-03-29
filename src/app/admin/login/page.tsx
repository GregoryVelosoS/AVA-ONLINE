import { Card } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/forms/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="container-page flex min-h-screen items-center justify-center">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-dark hidden p-8 lg:block">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-red-300">Acesso interno</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">Entre como ADM ou VISUALIZADOR para acessar a área autorizada do sistema.</h1>
        </section>

        <Card title="Login interno">
          <AdminLoginForm />
        </Card>
      </div>
    </main>
  );
}
