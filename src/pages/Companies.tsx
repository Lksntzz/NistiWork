import { useState } from 'react';
import { useCompanies, useCreateCompany } from '../queries/useCompanies';
import { CompanyFormModal } from '../components/CompanyFormModal';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getNextAction, formatStatus } from '../utils/companyUtils';
import { isBusinessDateOverdue } from '../utils/date';
import { Building2, Plus, AlertCircle, Search, Clock, CalendarDays, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export function Companies() {
  const { data: companies, isLoading } = useCompanies();
  const createCompany = useCreateCompany();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreate = (data: any) => {
    createCompany.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
        toast.success('Demanda criada com sucesso!');
      },
      onError: (err) => {
        toast.error('Erro ao criar demanda: ' + String(err));
      }
    });
  };

  const filteredCompanies = companies?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENTE': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'ALTA': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'NORMAL': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'BAIXA': return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
      default: return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Building2 className="text-indigo-500" size={32} />
            Demandas B2B
          </h1>
          <p className="text-neutral-400 mt-2">Gerencie suas demandas de arte e mockups.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Nova demanda
        </button>
      </header>

      <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 w-full max-w-md">
        <Search className="text-neutral-500 mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Buscar empresas..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-white w-full"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin text-indigo-500">
            <Building2 size={32} />
          </div>
        </div>
      ) : filteredCompanies?.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/50 rounded-2xl border border-neutral-800 border-dashed">
          <AlertCircle className="mx-auto text-neutral-600 mb-4" size={48} />
          <h3 className="text-xl font-medium text-white mb-2">Nenhuma demanda encontrada</h3>
          <p className="text-neutral-400">Crie uma nova demanda para começar a gerenciar.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCompanies?.map((company) => (
            <Link 
              key={company.id} 
              to={`/empresas/${company.id}`}
              className="group block bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 rounded-xl p-5 transition-all hover:bg-neutral-800/50 cursor-pointer"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-semibold text-white group-hover:text-indigo-400 transition-colors">
                      {company.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {formatStatus(company.status)}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPriorityColor(company.priority)}`}>
                        {company.priority}
                      </span>
                      {!!company.due_date && company.status !== 'CONCLUIDA' && isBusinessDateOverdue(company.due_date) && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full flex items-center">
                          Atrasada
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {company.description && (
                    <p className="text-neutral-400 text-sm">{company.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={16} />
                      <span>Entrou {formatDistanceToNow(parseISO(company.entry_date), { addSuffix: true, locale: ptBR })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-end md:items-end border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-6 min-w-[250px]">
                  <p className="text-xs text-neutral-500 uppercase font-semibold tracking-wider mb-2">Próxima Ação</p>
                  <p className="text-sm font-medium text-white bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-md flex items-center gap-2">
                    <ArrowRight size={16} />
                    {getNextAction(company.status)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CompanyFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createCompany.isPending}
      />
    </div>
  );
}
