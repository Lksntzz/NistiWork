import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCompany, useCompanyHistory, useUpdateCompanyStatus, useDeleteCompany, useUpdateCompany } from '../queries/useCompanies';
import { CompanyFormModal } from '../components/CompanyFormModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { getNextAction, formatStatus } from '../utils/companyUtils';
import { selectFolder } from '../services/apiClient';
import { isBusinessDateOverdue } from '../utils/date';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, FolderOpen, Clock, Edit2, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import toast from 'react-hot-toast';
import { invoke } from '@tauri-apps/api/core';

function CompanyDetailSkeleton() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8" aria-label="Carregando detalhes da demanda">
      <Skeleton className="h-5 w-40" />
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="flex-1 space-y-6">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-9 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
            <Skeleton className="mt-5 h-5 w-3/4" />
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="rounded-lg border border-neutral-800 bg-neutral-800/30 p-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="mt-3 h-6 w-24" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-14 w-full" />
          </div>
        </div>
        <div className="w-full space-y-6 md:w-80">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-4 h-10 w-full" />
            <Skeleton className="mt-3 h-3 w-3/4" />
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
            <Skeleton className="h-4 w-24" />
            <div className="mt-5 space-y-4">
              {[0, 1, 2].map((item) => (
                <div key={item} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_OPTIONS = [
  'NOVA',
  'PREPARANDO_ARQUIVOS',
  'CRIANDO_ARTE',
  'PDF_PRONTO',
  'CRIANDO_MOCKUP',
  'MOCKUP_PRONTO',
  'CONCLUIDA'
];

export function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: company, isLoading, isError } = useCompany(id!);
  const { data: history, isLoading: isHistoryLoading } = useCompanyHistory(id!);
  const updateStatus = useUpdateCompanyStatus();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();
  const reduceMotion = useReducedMotion();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statusFlash, setStatusFlash] = useState(false);
  const previousStatus = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentStatus = company?.status;
    if (!currentStatus) return;

    if (previousStatus.current && previousStatus.current !== currentStatus) {
      previousStatus.current = currentStatus;
      setStatusFlash(true);
      const timer = window.setTimeout(() => setStatusFlash(false), 850);
      return () => window.clearTimeout(timer);
    }

    previousStatus.current = currentStatus;
  }, [company?.status]);
  
  if (isLoading) {
    return <CompanyDetailSkeleton />;
  }

  if (isError) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center">
        <h2 className="text-xl font-bold text-red-500 mb-2">Erro ao carregar os dados</h2>
        <p className="text-neutral-400 mb-4">Ocorreu um erro ao buscar os detalhes da demanda.</p>
        <button onClick={() => navigate('/empresas')} className="text-indigo-400 hover:text-indigo-300">
          Voltar para a lista
        </button>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center">
        <h2 className="text-xl font-bold text-neutral-300 mb-2">Demanda não encontrada</h2>
        <p className="text-neutral-400 mb-4">A demanda que você está procurando não existe ou foi excluída.</p>
        <button onClick={() => navigate('/empresas')} className="text-indigo-400 hover:text-indigo-300">
          Voltar para a lista
        </button>
      </div>
    );
  }

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateStatus.mutate({ id: company.id, status: e.target.value }, {
      onSuccess: () => toast.success('Status atualizado')
    });
  };

  const handleEdit = (data: any) => {
    updateCompany.mutate({ ...company, ...data }, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        toast.success('Demanda atualizada');
      }
    });
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir esta demanda? Isso apagará o histórico e as tarefas vinculadas.')) {
      deleteCompany.mutate(company.id, {
        onSuccess: () => {
          toast.success('Demanda excluída');
          navigate('/empresas');
        }
      });
    }
  };

  const openLocalFolder = async () => {
    if (!company.local_folder_path || company.local_folder_path.trim() === '') return;
    try {
      await invoke('open_local_folder', { path: company.local_folder_path });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast.error(errorMsg, { duration: 5000 });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENTE': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'ALTA': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'NORMAL': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'BAIXA': return 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20';
      default: return 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20';
    }
  };

  const isOverdue = !!company.due_date && company.status !== 'CONCLUIDA' && isBusinessDateOverdue(company.due_date);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <button 
        onClick={() => navigate('/empresas')}
        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        Voltar para Demandas
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <header className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-white">{company.name}</h1>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2 bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-2 bg-neutral-800 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            {company.description && (
              <p className="text-neutral-400 text-lg mb-6">{company.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-800">
                <p className="text-xs text-neutral-500 mb-1">Prioridade</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(company.priority)}`}>
                  {company.priority}
                </span>
              </div>
              <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-800">
                <p className="text-xs text-neutral-500 mb-1">Entrada</p>
                <p className="text-sm text-white font-medium">
                  {format(parseISO(company.entry_date), "dd/MM/yyyy")}
                </p>
              </div>
              
              <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-800">
                <p className="text-xs text-neutral-500 mb-1">Prazo</p>
                <div className="flex flex-col items-start gap-1.5">
                  <p className="text-sm text-white font-medium">
                    {company.due_date ? format(parseISO(company.due_date), "dd/MM/yyyy") : '---'}
                  </p>
                  {isOverdue && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full">
                      Atrasada
                    </span>
                  )}
                </div>
              </div>
<motion.div
                className="p-4 rounded-lg border col-span-2 md:col-span-1"
                animate={{
                  backgroundColor: statusFlash ? 'rgba(99, 102, 241, 0.14)' : 'rgba(38, 38, 38, 0.5)',
                  borderColor: statusFlash ? 'rgba(99, 102, 241, 0.45)' : 'rgb(38, 38, 38)',
                }}
                transition={{ duration: reduceMotion ? 0 : 0.28 }}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs text-neutral-500">Status Atual</p>
                  <AnimatePresence>
                    {updateStatus.isPending && (
                      <motion.span
                        initial={reduceMotion ? false : { opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -2 }}
                        className="text-[10px] font-medium text-indigo-400"
                      >
                        Atualizando...
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <select
                  value={company.status}
                  onChange={handleStatusChange}
                  disabled={updateStatus.isPending}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-white text-sm outline-none focus:border-indigo-500 disabled:opacity-60"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{formatStatus(opt)}</option>
                  ))}
                </select>
              </motion.div>
            </div>
          </header>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                <ArrowRight size={16} className="text-indigo-500" />
                Próxima Ação
              </h3>
              <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-4 rounded-lg text-lg font-medium flex items-center gap-3">
                <CheckCircle2 size={24} />
                {getNextAction(company.status)}
              </div>
            </div>

            {company.notes && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">Observações</h3>
                <div className="bg-neutral-800 p-4 rounded-lg text-neutral-300 whitespace-pre-wrap text-sm border border-neutral-700">
                  {company.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Arquivos</h3>
            
            {company.local_folder_path ? (
              <div className="space-y-3">
                <button 
                  onClick={openLocalFolder}
                  className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2.5 rounded-lg transition-colors border border-neutral-700"
                >
                  <FolderOpen size={18} />
                  Abrir Pasta Local
                </button>
                <p className="text-xs text-neutral-500 text-center break-all">
                  {company.local_folder_path}
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={async () => {
                      const selected = await selectFolder();
                      if (selected) {
                        updateCompany.mutate({ ...company, local_folder_path: selected }, {
                          onSuccess: () => toast.success('Pasta atualizada')
                        });
                      }
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Alterar pasta
                  </button>
                  <span className="text-neutral-700">•</span>
                  <button
                    onClick={() => {
                      updateCompany.mutate({ ...company, local_folder_path: null }, {
                        onSuccess: () => toast.success('Pasta removida')
                      });
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-sm text-neutral-500">Nenhuma pasta local definida</p>
                <button
                  onClick={async () => {
                    const selected = await selectFolder();
                    if (selected) {
                      updateCompany.mutate({ ...company, local_folder_path: selected }, {
                        onSuccess: () => toast.success('Pasta definida')
                      });
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2.5 rounded-lg transition-colors border border-neutral-700"
                >
                  <FolderOpen size={18} />
                  Escolher pasta
                </button>
              </div>
            )}
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Histórico</h3>
            {isHistoryLoading ? (
              <div className="space-y-5">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="space-y-2 border-l-2 border-neutral-800 pl-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                ))}
              </div>
            ) : (
              <motion.div layout className="space-y-4">
                <AnimatePresence initial={false} mode="popLayout">
                  {history?.map((h, index) => (
                    <motion.div
                      layout
                      key={h.id}
                      initial={reduceMotion ? false : { opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, x: -4 }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.18,
                        delay: reduceMotion ? 0 : Math.min(index * 0.02, 0.08),
                      }}
                      className="relative pl-4 border-l-2 border-neutral-800 pb-2 last:border-0 last:pb-0"
                    >
                      <motion.div
                        initial={reduceMotion ? false : { scale: 0.6 }}
                        animate={{ scale: 1 }}
                        className="absolute -left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-neutral-600 border-2 border-neutral-900"
                      />
                      <p className="text-sm text-white font-medium">
                        {h.action === 'COMPANY_CREATED' ? 'Demanda Criada' : 'Status Alterado'}
                      </p>
                      {h.new_status && h.action === 'COMPANY_STATUS_CHANGED' && (
                        <p className="text-xs text-neutral-400 mt-1">
                          {h.previous_status ? formatStatus(h.previous_status) + ' → ' : ''}
                          <span className="text-indigo-400 font-medium">{formatStatus(h.new_status)}</span>
                        </p>
                      )}
                      <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                        <Clock size={12} />
                        {format(parseISO(h.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <CompanyFormModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEdit}
        isLoading={updateCompany.isPending}
        initialData={company}
      />
    </div>
  );
}
