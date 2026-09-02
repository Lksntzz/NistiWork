import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Converte uma string ISO 8601 (UTC, vinda do banco) para uma string legível no horário local.
 * Contexto de negócio: America/Sao_Paulo (tratado pelo ambiente do usuário).
 */
export function formatToLocal(isoDateString: string, formatStr: string = 'dd/MM/yyyy HH:mm'): string {
  if (!isoDateString) return '';
  try {
    const date = parseISO(isoDateString);
    return format(date, formatStr, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return isoDateString;
  }
}

/**
 * Gera um timestamp ISO 8601 em UTC para salvar no banco.
 * Utilizado primariamente pelo backend (Rust), mas disponível caso o frontend precise gerar algo temporário.
 */
export function generateUTCTimestamp(): string {
  return new Date().toISOString();
}
