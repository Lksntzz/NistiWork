export function Queue() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Minha Fila</h1>
        <p className="text-zinc-400 mt-1">Gerencie suas tarefas e prioridades diárias.</p>
      </div>
      
      <div className="flex h-64 items-center justify-center border border-dashed border-zinc-800 rounded-xl">
        <p className="text-zinc-500">Em breve: Kanban / Lista de prioridades</p>
      </div>
    </div>
  );
}
