"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBanner } from "@/components/ui/status-banner";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "ADM" | "VISUALIZADOR";
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

type Props = {
  users: UserItem[];
  currentUserId: string;
};

function roleLabel(role: UserItem["role"]) {
  return role === "ADM" ? "ADM" : "VISUALIZADOR";
}

function formatDate(value: string | null) {
  if (!value) return "Nunca";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function UserManagementPanel({ users, currentUserId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "ADM" | "VISUALIZADOR">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADM" | "VISUALIZADOR">("VISUALIZADOR");
  const [password, setPassword] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"ADM" | "VISUALIZADOR">("VISUALIZADOR");
  const [editPassword, setEditPassword] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter && user.role !== roleFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [user.name, user.email, roleLabel(user.role)].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [roleFilter, search, users]);

  function resetCreateForm() {
    setName("");
    setEmail("");
    setRole("VISUALIZADOR");
    setPassword("");
  }

  function resetEditForm() {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
    setEditRole("VISUALIZADOR");
    setEditPassword("");
    setEditIsActive(true);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        role,
        password
      })
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error || "Não foi possível criar o usuário.");
      return;
    }

    resetCreateForm();
    setSuccess("Usuário criado com sucesso.");
    startTransition(() => router.refresh());
  }

  function startEdit(user: UserItem) {
    setEditingId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPassword("");
    setEditIsActive(user.isActive);
    setError(null);
    setSuccess(null);
  }

  async function handleUpdate(userId: string) {
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        email: editEmail,
        role: editRole,
        isActive: editIsActive,
        password: editPassword
      })
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error || "Não foi possível atualizar o usuário.");
      return;
    }

    resetEditForm();
    setSuccess("Usuário atualizado com sucesso.");
    startTransition(() => router.refresh());
  }

  async function handleDelete(user: UserItem) {
    const confirmed = window.confirm(`Deseja realmente excluir o usuário "${user.name}"?`);
    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE"
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error || "Não foi possível excluir o usuário.");
      return;
    }

    setSuccess("Usuário excluído com sucesso.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <form className="surface-panel grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleCreate}>
        <div>
          <label className="field-label">Nome</label>
          <input className="input-base" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div>
          <label className="field-label">E-mail de acesso</label>
          <input className="input-base" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div>
          <label className="field-label">Tipo</label>
          <select className="input-base" value={role} onChange={(event) => setRole(event.target.value as "ADM" | "VISUALIZADOR")}>
            <option value="ADM">ADM</option>
            <option value="VISUALIZADOR">VISUALIZADOR</option>
          </select>
        </div>
        <div>
          <label className="field-label">Senha</label>
          <input
            className="input-base"
            type="password"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div className="xl:col-span-4">
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-primary" disabled={isPending} type="submit">
              {isPending ? "Salvando..." : "Criar usuário"}
            </button>
            {error ? <StatusBanner tone="error" message={error} /> : null}
            {success ? <StatusBanner tone="success" message={success} /> : null}
          </div>
        </div>
      </form>

      <section className="surface-panel space-y-5 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">Usuários cadastrados</h2>
            <p className="mt-1 text-sm text-slate-500">Pesquise, filtre, edite, ative, desative ou exclua usuários internos.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,240px)_180px]">
            <input
              className="input-base"
              placeholder="Buscar por nome ou e-mail"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select className="input-base" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "" | "ADM" | "VISUALIZADOR")}>
              <option value="">Todos os tipos</option>
              <option value="ADM">ADM</option>
              <option value="VISUALIZADOR">VISUALIZADOR</option>
            </select>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState
            title="Nenhum usuário encontrado"
            description={users.length === 0 ? "Crie o primeiro usuário interno para começar." : "Tente outro termo de busca ou filtro."}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-[linear-gradient(90deg,#101010_0%,#2a0e12_100%)] text-left text-white">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criado em</th>
                  <th className="px-4 py-3">Último acesso</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredUsers.map((user) => {
                  const editing = editingId === user.id;
                  const isCurrentUser = currentUserId === user.id;

                  return (
                    <tr key={user.id} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-3">
                        {editing ? (
                          <input className="input-base" value={editName} onChange={(event) => setEditName(event.target.value)} />
                        ) : (
                          <div>
                            <p className="font-semibold text-slate-950">{user.name}</p>
                            {isCurrentUser ? <p className="text-xs font-semibold text-red-700">Usuário atual</p> : null}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <input className="input-base" type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} />
                        ) : (
                          user.email
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <select className="input-base" value={editRole} onChange={(event) => setEditRole(event.target.value as "ADM" | "VISUALIZADOR")}>
                            <option value="ADM">ADM</option>
                            <option value="VISUALIZADOR">VISUALIZADOR</option>
                          </select>
                        ) : (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                            {roleLabel(user.role)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input checked={editIsActive} onChange={(event) => setEditIsActive(event.target.checked)} type="checkbox" />
                            Ativo
                          </label>
                        ) : (
                          <span
                            className={[
                              "rounded-full border px-3 py-1 text-xs font-bold",
                              user.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"
                            ].join(" ")}
                          >
                            {user.isActive ? "Ativo" : "Inativo"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(user.lastLoginAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {editing ? (
                            <>
                              <input
                                className="input-base min-w-[220px]"
                                placeholder="Nova senha (opcional)"
                                type="password"
                                minLength={6}
                                value={editPassword}
                                onChange={(event) => setEditPassword(event.target.value)}
                              />
                              <button className="btn-primary" onClick={() => handleUpdate(user.id)} type="button">
                                Salvar
                              </button>
                              <button className="btn-secondary" onClick={resetEditForm} type="button">
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="btn-secondary" onClick={() => startEdit(user)} type="button">
                                Editar
                              </button>
                              <button className="btn-danger" disabled={isCurrentUser} onClick={() => handleDelete(user)} type="button">
                                Excluir
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
