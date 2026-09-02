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
  due_date?: string | null;
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
