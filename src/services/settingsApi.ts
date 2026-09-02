import { invoke } from './apiClient';

export interface SettingsData {
  local_folder_path: string | null;
  active_year: string | null;
  weekly_priority: string | null;
  theme: string | null;
}

export const settingsApi = {
  getSettings: async (): Promise<SettingsData> => {
    // Retorna um objeto com todas as configurações lidas do backend
    return invoke<SettingsData>('get_settings');
  },

  saveSettings: async (payload: SettingsData): Promise<void> => {
    await invoke('save_settings', { payload });
  }
};
