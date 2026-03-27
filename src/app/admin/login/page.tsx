import { Card } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/forms/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="container-page flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <Card title="Login do Administrador">
          <AdminLoginForm />
        </Card>
      </div>
    </main>
  );
}
