const fs = require('fs');
const path = require('path');

const write = (p, content) => {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, content.trim() + '\n');
};

const src = 'src';

// Types
write(`${src}/types/index.ts`, `
export interface Settings {
  active_year: string | null;
  week_focus: string | null;
  local_root_path: string | null;
  drive_root_id: string | null;
}

export type Priority = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
export type CompanyStatus = 'NOVA' | 'PREPARANDO_ARQUIVOS' | 'CRIANDO_ARTE' | 'PDF_PRONTO' | 'CRIANDO_MOCKUP' | 'MOCKUP_PRONTO' | 'CONCLUIDA';
export type TaskStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export interface Company {
  id: string;
  name: string;
  description: string | null;
  entry_date: string;
  priority: Priority;
  status: CompanyStatus;
  local_folder_path: string | null;
  drive_folder_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityHistory {
  id: string;
  entity_name: string;
  entity_id: string;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  metadata: string | null;
  timestamp: string;
}
`);

// API
write(`${src}/api/companiesApi.ts`, `
import { invoke } from '@tauri-apps/api/core';
import { Company, ActivityHistory } from '../types';

export const companiesApi = {
  list: (): Promise<Company[]> => invoke('list_companies'),
  
  get: (id: string): Promise<Company | null> => invoke('get_company', { id }),
  
  create: (company: Omit<Company, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<Company> => 
    // We send a partial Company, the Rust backend ignores id, status, etc for creation but expects the struct.
    invoke('create_company', { 
      company: {
        ...company,
        id: '',
        status: 'NOVA',
        created_at: '',
        updated_at: ''
      }
    }),
    
  update: (company: Company): Promise<void> => invoke('update_company', { company }),
  
  updateStatus: (id: string, status: string): Promise<void> => invoke('update_company_status', { id, status }),
  
  delete: (id: string): Promise<void> => invoke('delete_company', { id }),
  
  getHistory: (id: string): Promise<ActivityHistory[]> => invoke('get_company_history', { id }),
};
`);

// Queries
write(`${src}/queries/useCompanies.ts`, `
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesApi } from '../api/companiesApi';
import { Company } from '../types';

export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: companiesApi.list,
  });
};

export const useCompany = (id: string) => {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: () => companiesApi.get(id),
    enabled: !!id,
  });
};

export const useCompanyHistory = (id: string) => {
  return useQuery({
    queryKey: ['companies', id, 'history'],
    queryFn: () => companiesApi.getHistory(id),
    enabled: !!id,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companiesApi.update,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies', variables.id] });
    },
  });
};

export const useUpdateCompanyStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => companiesApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['companies', variables.id, 'history'] });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companiesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};
`);

// Utils
write(`${src}/utils/companyUtils.ts`, `
import { CompanyStatus } from '../types';

export function getNextAction(status: CompanyStatus | string): string {
  switch (status) {
    case 'NOVA': return 'Preparar arquivos';
    case 'PREPARANDO_ARQUIVOS': return 'Iniciar criação da arte';
    case 'CRIANDO_ARTE': return 'Finalizar arte e gerar PDF';
    case 'PDF_PRONTO': return 'Criar mockup';
    case 'CRIANDO_MOCKUP': return 'Finalizar mockup';
    case 'MOCKUP_PRONTO': return 'Concluir demanda';
    case 'CONCLUIDA': return 'Finalizada';
    default: return 'Sem ação definida';
  }
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}
`);
