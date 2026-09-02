import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus } from 'lucide-react';

export function Companies() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Empresas</h1>
          <p className="text-zinc-400 mt-1">Demandas e clientes B2B ativos.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Nova Demanda
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mock Data for visual validation */}
        <Card className="hover:border-zinc-700 transition-colors cursor-pointer">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-zinc-100">Papelaria Criativa</h3>
                <p className="text-sm text-zinc-500 mt-1">Agendas 2028 - Lote 1</p>
              </div>
              <Badge variant="info">CRIANDO_ARTE</Badge>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-zinc-500">Entrada: 01/09/2026</span>
              <Badge variant="danger">ALTA</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
