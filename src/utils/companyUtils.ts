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
