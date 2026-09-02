export type Priority = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';

export type TaskStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export type CompanyStatus = 
  | 'NOVA' 
  | 'PREPARANDO_ARQUIVOS' 
  | 'CRIANDO_ARTE' 
  | 'PDF_PRONTO' 
  | 'CRIANDO_MOCKUP' 
  | 'MOCKUP_PRONTO' 
  | 'CONCLUIDA';

export type ArtStatus = 'PENDENTE' | 'EM_PRODUCAO' | 'FINALIZADO' | 'REVISAO';
export type PdfStatus = 'PENDENTE' | 'EM_PRODUCAO' | 'FINALIZADO' | 'REVISAO';
export type MockupStatus = 'PENDENTE' | 'EM_PRODUCAO' | 'FINALIZADO' | 'REVISAO';
export type SyncStatus = 'PENDENTE' | 'SINCRONIZADO' | 'ERRO';

// Base interface com UUID e timestamps
export interface BaseEntity {
  id: string; // UUID
  created_at: string; // ISO 8601 UTC
  updated_at: string; // ISO 8601 UTC
}

export interface Company extends BaseEntity {
  name: string;
  description: string | null;
  entry_date: string; // ISO 8601 UTC
  priority: Priority;
  status: CompanyStatus;
  local_folder_path: string | null;
  drive_folder_id: string | null;
  notes: string | null;
}

export interface Task extends BaseEntity {
  title: string;
  priority: Priority;
  status: TaskStatus;
  due_date: string | null; // ISO 8601 UTC
  
  // XOR Rule: company_id OR cover_id OR both null. NEVER both filled.
  company_id: string | null;
  cover_id: string | null;
}

export interface Listing extends BaseEntity {
  platform_id: string;
  category_id: string;
  collection_id: string;
  year: number;
  title: string;
}

export interface Cover extends BaseEntity {
  listing_id: string;
  position: number; // INTEGER NOT NULL
  name_number: string | null; // Label descritivo opcional
  sku: string | null; // UNIQUE quando preenchido
  ean: string | null; // UNIQUE quando preenchido
  status_art: ArtStatus;
  status_pdf: PdfStatus;
  status_mockup: MockupStatus;
  notes: string | null;
}
