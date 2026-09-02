import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

// Função auxiliar para verificar se estamos rodando dentro do Tauri
export const isTauri = () => '__TAURI_INTERNALS__' in window;

// --- MOCK STATE PARA O PREVIEW WEB ---
let mockSettings: Record<string, string | null> = {
  'local_folder_path': 'C:\\NistiWork',
  'active_year': '2027',
  'weekly_priority': 'NORMAL',
  'theme': 'dark'
};
// -------------------------------------

/**
 * Wrapper tipado para o invoke do Tauri.
 * Quando roda no navegador (AI Studio Preview), utiliza os mocks locais.
 */
export const invoke = async <T>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
  if (isTauri()) {
    return tauriInvoke(cmd, args);
  }

  // --- COMPORTAMENTO MOCK PARA PREVIEW WEB ---
  console.log(`[Mock Invoke] ${cmd}`, args);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      if (cmd === 'get_settings') {
        resolve(mockSettings as T);
        return;
      }
      
      if (cmd === 'save_settings') {
        const { payload } = args as { payload: Record<string, string | null> };
        mockSettings = { ...mockSettings, ...payload };
        resolve(null as T);
        return;
      }
      
      resolve(null as T);
    }, 300); // Simulando delay de rede/disco
  });
};

/**
 * Wrapper para seleção de pastas.
 */
export const selectFolder = async (): Promise<string | null> => {
  if (isTauri()) {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    return selected as string | null;
  }
  
  // Mock para o navegador
  return new Promise((resolve) => {
    setTimeout(() => resolve("C:\\NistiWork\\MockFolder"), 500);
  });
};
