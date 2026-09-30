import { useState } from 'react';
import { useCompanies, useCreateCompany } from '../queries/useCompanies';
import { CompanyFormModal } from '../components/CompanyFormModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getNextAction, formatStatus } from '../utils/companyUtils';
import { isBusinessDateOverdue } from '../utils/date';
import { Building2, Plus, AlertCircle, Search, CalendarDays, ArrowRight, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

function CompaniesSkeleton() {
  return (
    <div className="grid gap-4" aria-label="Carregando demandas">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-6 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="min-w-[220px]">
              <Skeleton className="ml-auto h-4 w-24" />
              <Skeleton className="ml-auto mt-2 h-8 w-40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Companies() {
  const { data: companies, isLoading } = useCompanies();
  const createCompany = useCreateCompany();
  const reduceMotion = useReducedMotion();
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

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCompanies = companies?.filter(c =>
    c.name.toLowerCase().includes(normalizedSearch)
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

        <motion.button
          onClick={() => setIsModalOpen(true)}
          whileHover={reduceMotion ? undefined : { y: -1 }}
          whileTap={reduceMotion ? undefined : { scale: 0.975 }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Nova demanda
        </motion.button>
      </header>

      <div className="space-y-3">
        <div className="flex items-center bg-neutral-900 border border-neutral-800 focus-within:border-indigo-500/60 rounded-lg px-4 py-2 w-full max-w-md transition-colors">
          <Search className="text-neutral-500 mr-3" size={20} />
          <input
            type="text"
            placeholder="Buscar empresas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-white w-full"
          />
          <AnimatePresence>
            {searchTerm && (
              <motion.button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setSearchTerm('')}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
                className="ml-2 rounded-md p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
              >
                <X size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {normalizedSearch && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              className="flex items-center gap-2"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
                Busca: “{searchTerm.trim()}”
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-indigo-300/70 hover:text-indigo-100"
                  aria-label="Remover filtro de busca"
                >
                  <X size={13} />
                </button>
              </span>
              <span className="text-xs text-neutral-500">
                {filteredCompanies?.length ?? 0} resultado(s)
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isLoading ? (
        <CompaniesSkeleton />
      ) : filteredCompanies?.length === 0 ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-neutral-900/50 rounded-2xl border border-neutral-800 border-dashed"
        >
          <AlertCircle className="mx-auto text-neutral-600 mb-4" size={48} />
          <h3 className="text-xl font-medium text-white mb-2">Nenhuma demanda encontrada</h3>
          <p className="text-neutral-400">
            {normalizedSearch
              ? 'Ajuste ou limpe o filtro para ver outras demandas.'
              : 'Crie uma nova demanda para começar a gerenciar.'}
          </p>
        </motion.div>
      ) : (
        <motion.div layout className="grid gap-4">
          <AnimatePresence initial={false} mode="popLayout">
            {filteredCompanies?.map((company, index) => (
              <motion.div
                layout
                key={company.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: -4 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.2,
                  delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.12),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  to={`/empresas/${company.id}`}
                  className="group block bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 rounded-xl p-5 transition-[background-color,border-color,box-shadow] hover:bg-neutral-800/50 hover:shadow-lg hover:shadow-black/10 cursor-pointer"
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
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
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
