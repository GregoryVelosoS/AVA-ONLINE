"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBanner } from "@/components/ui/status-banner";
import { EmptyState } from "@/components/ui/empty-state";

type Discipline = {
  id: string;
  name: string;
};

type Item = {
  id: string;
  code: string;
  name: string;
  disciplineId?: string | null;
  discipline?: Discipline | null;
};

type CatalogManagerProps = {
  endpoint: "/api/admin/disciplines" | "/api/admin/class-groups";
  itemLabel: string;
  items: Item[];
  disciplines?: Discipline[];
  withDiscipline?: boolean;
};

export function CatalogManager({
  endpoint,
  itemLabel,
  items,
  disciplines = [],
  withDiscipline = false
}: CatalogManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [disciplineId, setDisciplineId] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editDisciplineId, setEditDisciplineId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return items;
    }

    return items.filter((item) =>
      [item.code, item.name, item.discipline?.name || ""].some((value) => value.toLowerCase().includes(normalizedSearch))
    );
  }, [items, search]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        name,
        disciplineId: withDiscipline ? disciplineId : undefined
      })
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error || `Não foi possível salvar ${itemLabel.toLowerCase()}.`);
      return;
    }

    setCode("");
    setName("");
    setDisciplineId("");
    setSuccess(`${itemLabel} cadastrado com sucesso.`);
    startTransition(() => router.refresh());
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditCode(item.code);
    setEditName(item.name);
    setEditDisciplineId(item.disciplineId || item.discipline?.id || "");
    setError(null);
    setSuccess(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditCode("");
    setEditName("");
    setEditDisciplineId("");
  }

  async function saveEdit(itemId: string) {
    setError(null);
    setSuccess(null);

    const response = await fetch(`${endpoint}/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: editCode,
        name: editName,
        disciplineId: withDiscipline ? editDisciplineId : undefined
      })
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error || `Não foi possível atualizar ${itemLabel.toLowerCase()}.`);
      return;
    }

    setSuccess(`${itemLabel} atualizado com sucesso.`);
    cancelEdit();
    startTransition(() => router.refresh());
  }

  async function removeItem(itemId: string, itemName: string) {
    const confirmed = window.confirm(`Deseja realmente excluir ${itemLabel.toLowerCase()} "${itemName}"?`);
    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccess(null);
    const response = await fetch(`${endpoint}/${itemId}`, {
      method: "DELETE"
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error || `Não foi possível excluir ${itemLabel.toLowerCase()}.`);
      return;
    }

    setSuccess(`${itemLabel} excluído com sucesso.`);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <form className="surface-panel grid gap-4 p-5 md:grid-cols-3" onSubmit={handleSubmit}>
        <div>
          <label className="field-label">Código</label>
          <input className="input-base" value={code} onChange={(event) => setCode(event.target.value)} required />
        </div>
        <div>
          <label className="field-label">Nome</label>
          <input className="input-base" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        {withDiscipline ? (
          <div>
            <label className="field-label">Disciplina vinculada</label>
            <select className="input-base" value={disciplineId} onChange={(event) => setDisciplineId(event.target.value)}>
              <option value="">Sem vínculo fixo</option>
              {disciplines.map((discipline) => (
                <option key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="md:col-span-3">
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-primary" disabled={isPending} type="submit">
              {isPending ? "Salvando..." : `Cadastrar ${itemLabel.toLowerCase()}`}
            </button>
            {error ? <StatusBanner tone="error" message={error} /> : null}
            {success ? <StatusBanner tone="success" message={success} /> : null}
          </div>
        </div>
      </form>

      <div className="surface-panel p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Listagem de {itemLabel.toLowerCase()}s</h2>
            <p className="text-sm text-slate-500">Pesquise, edite e exclua registros já cadastrados.</p>
          </div>
          <input
            className="input-base md:max-w-xs"
            placeholder={`Pesquisar ${itemLabel.toLowerCase()}...`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {filteredItems.length === 0 ? (
          <EmptyState
            title={`Nenhum ${itemLabel.toLowerCase()} encontrado`}
            description={items.length === 0 ? `Cadastre o primeiro ${itemLabel.toLowerCase()} para começar.` : "Tente outro termo de pesquisa."}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-[linear-gradient(90deg,#101010_0%,#2a0e12_100%)] text-left text-white">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nome</th>
                  {withDiscipline ? <th className="px-4 py-3">Disciplina</th> : null}
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredItems.map((item) => {
                  const editing = editingId === item.id;

                  return (
                    <tr key={item.id} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-3">
                        {editing ? (
                          <input className="input-base" value={editCode} onChange={(event) => setEditCode(event.target.value)} />
                        ) : (
                          <span className="font-semibold">{item.code}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <input className="input-base" value={editName} onChange={(event) => setEditName(event.target.value)} />
                        ) : (
                          item.name
                        )}
                      </td>
                      {withDiscipline ? (
                        <td className="px-4 py-3">
                          {editing ? (
                            <select className="input-base" value={editDisciplineId} onChange={(event) => setEditDisciplineId(event.target.value)}>
                              <option value="">Sem vínculo fixo</option>
                              {disciplines.map((discipline) => (
                                <option key={discipline.id} value={discipline.id}>
                                  {discipline.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-slate-500">{item.discipline?.name || "Sem vínculo"}</span>
                          )}
                        </td>
                      ) : null}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {editing ? (
                            <>
                              <button className="btn-primary" onClick={() => saveEdit(item.id)} type="button">
                                Salvar
                              </button>
                              <button className="btn-secondary" onClick={cancelEdit} type="button">
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="btn-secondary" onClick={() => startEdit(item)} type="button">
                                Editar
                              </button>
                              <button className="btn-danger" onClick={() => removeItem(item.id, item.name)} type="button">
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
      </div>
    </div>
  );
}
