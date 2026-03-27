import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container-page space-y-4">
      <h1 className="text-3xl font-bold">AVA Online</h1>
      <p>Plataforma para criação, aplicação e análise de avaliações online.</p>
      <div className="flex gap-3">
        <Link className="rounded bg-slate-900 px-4 py-2 text-white" href="/admin/login">
          Entrar como Admin
        </Link>
        <Link className="rounded border border-slate-300 px-4 py-2" href="/exam/demo">
          Acessar prova pública (demo)
        </Link>
      </div>
    </main>
  );
}
