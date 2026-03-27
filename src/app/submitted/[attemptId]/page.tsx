export default async function SubmittedPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;

  return (
    <main className="container-page space-y-2">
      <h1 className="text-2xl font-bold">Prova enviada com sucesso ✅</h1>
      <p>Protocolo da tentativa: <strong>{attemptId}</strong></p>
      <p>Obrigado pela participação.</p>
    </main>
  );
}
