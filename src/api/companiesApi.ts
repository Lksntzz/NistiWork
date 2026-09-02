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
