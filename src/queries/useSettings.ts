import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, SettingsData } from '@/services/settingsApi';
import toast from 'react-hot-toast';

const SETTINGS_QUERY_KEY = ['settings'];

export function useSettings() {
  return useQuery<SettingsData, Error>({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: settingsApi.getSettings,
  });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SettingsData) => settingsApi.saveSettings(payload),
    onSuccess: () => {
      toast.success(`Configurações salvas com sucesso!`);
      // Invalida o cache para forçar recarregamento
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error('Erro ao salvar configurações.');
      console.error(error);
    }
  });
}
