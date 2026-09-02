import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, AlertCircle, PlayCircle, PlusCircle } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Visão Geral</h1>
        <p className="text-zinc-400 mt-1">O que você precisa fazer agora.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Atrasadas</p>
              <h2 className="text-2xl font-bold text-zinc-100">2</h2>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Para Hoje</p>
              <h2 className="text-2xl font-bold text-zinc-100">5</h2>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <PlayCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Em Andamento</p>
              <h2 className="text-2xl font-bold text-zinc-100">3</h2>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Novas Demandas</p>
              <h2 className="text-2xl font-bold text-zinc-100">1</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-zinc-100">Minha Fila (Prioridades)</h3>
          
          <div className="space-y-3">
            {[
              { id: 1, title: 'Finalizar arte Capa Devocional', entity: 'Anúncio 001', priority: 'URGENTE', type: 'danger' },
              { id: 2, title: 'Preparar Mockups', entity: 'Empresa ABC', priority: 'ALTA', type: 'warning' },
              { id: 3, title: 'Exportar PDFs', entity: 'Empresa XYZ', priority: 'NORMAL', type: 'info' }
            ].map((task) => (
              <Card key={task.id} className="hover:border-zinc-700 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-zinc-200">{task.title}</h4>
                    <p className="text-sm text-zinc-500 mt-1">{task.entity}</p>
                  </div>
                  <Badge variant={task.type as any}>{task.priority}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-100">Atividade Recente</h3>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-800/50">
                <div className="p-4 text-sm">
                  <span className="text-zinc-300">Empresa ABC</span>
                  <p className="text-zinc-500 mt-1">PDF gerado e sincronizado.</p>
                  <span className="text-xs text-zinc-600 mt-2 block">Há 2 horas</span>
                </div>
                <div className="p-4 text-sm">
                  <span className="text-zinc-300">Capa Devocional</span>
                  <p className="text-zinc-500 mt-1">Arte finalizada.</p>
                  <span className="text-xs text-zinc-600 mt-2 block">Ontem</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
