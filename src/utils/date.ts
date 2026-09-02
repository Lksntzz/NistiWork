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

/**
 * Retorna a data civil atual no fuso horrio local (America/Sao_Paulo) no formato YYYY-MM-DD.
 * Fixo para lidar corretamente com fusos horrios em horrios como 22:00 BRT, evitando avanar 
 * a data para o dia seguinte do UTC.
 */
export function getBusinessDateToday(): string {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  
  return `${year}-${month}-${day}`;
}

/**
 * Verifica se uma data de negcio (YYYY-MM-DD) est atrasada considerando o fuso local (America/Sao_Paulo).
 * Retorna true apenas se a data de vencimento for estritamente anterior data de hoje no fuso local.
 */
export function isBusinessDateOverdue(businessDate: string): boolean {
  if (!businessDate) return false;
  const todayStr = getBusinessDateToday();
  return businessDate < todayStr;
}
