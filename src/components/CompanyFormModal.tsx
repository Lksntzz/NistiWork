import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Priority } from '../types';

const companySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  entry_date: z.string().min(1, 'Data de entrada é obrigatória'),
  priority: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'] as const),
  local_folder_path: z.string().optional(),
  notes: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CompanyFormData, 'status'>) => void;
  isLoading: boolean;
  initialData?: Partial<CompanyFormData>;
}

export function CompanyFormModal({ isOpen, onClose, onSubmit, isLoading, initialData }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      entry_date: new Date().toISOString().split('T')[0],
      priority: 'NORMAL',
      local_folder_path: '',
      notes: '',
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-neutral-800">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">
            {initialData ? 'Editar Demanda' : 'Nova Demanda'}
          </h2>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Nome da empresa *</label>
            <input
              {...register('name')}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
              placeholder="Ex: Nisti"
            />
            {errors.name && <span className="text-red-400 text-sm">{errors.name.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Descrição</label>
            <input
              {...register('description')}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
              placeholder="Ex: Criação de logo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Data de entrada *</label>
              <input
                type="date"
                {...register('entry_date')}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
              />
              {errors.entry_date && <span className="text-red-400 text-sm">{errors.entry_date.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Prioridade *</label>
              <select
                {...register('priority')}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="BAIXA">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Pasta local (opcional)</label>
            <input
              {...register('local_folder_path')}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
              placeholder="Ex: C:/Projetos/Empresa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Observações</label>
            <textarea
              {...register('notes')}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors resize-none h-24"
              placeholder="Detalhes adicionais..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salvar Demanda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
