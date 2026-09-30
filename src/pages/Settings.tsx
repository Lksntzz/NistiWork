import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ActionButton, ActionState } from '@/components/ui/ActionButton';
import { useSettings, useSaveSettings } from '@/queries/useSettings';
import { selectFolder } from '@/services/apiClient';
import { SettingsData } from '@/services/settingsApi';
import { GoogleDriveSettings } from '@/components/GoogleDriveSettings';
import { FolderOpen, Save, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState, useEffect } from 'react';

export function Settings() {
  const { data: settings, isLoading } = useSettings();
  const saveSettingsMutation = useSaveSettings();
  const reduceMotion = useReducedMotion();

  const [localSettings, setLocalSettings] = useState<SettingsData>({
    local_folder_path: null,
    active_year: null,
    weekly_priority: null,
    theme: 'dark'
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        local_folder_path: settings.local_folder_path || '',
        active_year: settings.active_year || '',
        weekly_priority: settings.weekly_priority || '',
        theme: settings.theme || 'dark'
      });
    }
  }, [settings]);

  const isDirty = JSON.stringify(localSettings) !== JSON.stringify({
    local_folder_path: settings?.local_folder_path || '',
    active_year: settings?.active_year || '',
    weekly_priority: settings?.weekly_priority || '',
    theme: settings?.theme || 'dark'
  });

  const resetSaveFeedback = () => {
    if (saveSettingsMutation.isSuccess || saveSettingsMutation.isError) {
      saveSettingsMutation.reset();
    }
  };

  const handleSelectFolder = async () => {
    const selected = await selectFolder();
    if (selected) {
      resetSaveFeedback();
      setLocalSettings(prev => ({ ...prev, local_folder_path: selected }));
    }
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(localSettings);
  };

  const saveState: ActionState = saveSettingsMutation.isPending
    ? 'loading'
    : saveSettingsMutation.isError
      ? 'error'
      : saveSettingsMutation.isSuccess
        ? 'success'
        : 'idle';

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-zinc-500">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Configurações</h1>
          <p className="text-zinc-400 mt-1">Preferências e integrações do Nisti Work.</p>
        </div>

        <AnimatePresence>
          {isDirty && !saveSettingsMutation.isPending && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              className="flex items-center gap-2 text-amber-400 text-sm font-medium"
            >
              <AlertCircle className="w-4 h-4" />
              Alterações não salvas
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-zinc-100">Geral</h3>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400 font-medium">Workspace Local Principal</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  disabled
                  value={localSettings.local_folder_path || ''}
                  placeholder="Selecione a pasta raiz..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 disabled:opacity-50"
                />
                <motion.button
                  onClick={handleSelectFolder}
                  disabled={saveSettingsMutation.isPending}
                  whileHover={reduceMotion ? undefined : { y: -1 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.975 }}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <FolderOpen className="w-4 h-4" />
                  Escolher pasta
                </motion.button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400 font-medium">Ano Ativo</label>
              <input
                type="text"
                value={localSettings.active_year || ''}
                onChange={(e) => {
                  resetSaveFeedback();
                  setLocalSettings(prev => ({ ...prev, active_year: e.target.value }));
                }}
                disabled={saveSettingsMutation.isPending}
                placeholder="Ex: 2027"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400 font-medium">Foco da Semana (Prioridade)</label>
              <select
                value={localSettings.weekly_priority || ''}
                onChange={(e) => {
                  resetSaveFeedback();
                  setLocalSettings(prev => ({ ...prev, weekly_priority: e.target.value }));
                }}
                disabled={saveSettingsMutation.isPending}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              >
                <option value="">Selecione...</option>
                <option value="BAIXA">BAIXA</option>
                <option value="NORMAL">NORMAL</option>
                <option value="ALTA">ALTA</option>
                <option value="URGENTE">URGENTE</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400 font-medium">Tema (UI)</label>
              <select
                value={localSettings.theme || 'dark'}
                onChange={(e) => {
                  resetSaveFeedback();
                  setLocalSettings(prev => ({ ...prev, theme: e.target.value }));
                }}
                disabled={saveSettingsMutation.isPending}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              >
                <option value="dark">Dark (Padrão)</option>
                <option value="light" disabled>Light (Em breve)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-zinc-100">Google Drive</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleDriveSettings />
          </CardContent>
        </Card>
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-64 right-0 p-4 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800 flex justify-end z-10"
      >
        <div className="max-w-6xl mx-auto w-full flex justify-end">
          <ActionButton
            onClick={handleSave}
            disabled={!isDirty || saveSettingsMutation.isPending}
            state={saveState}
            idleLabel="Salvar configurações"
            loadingLabel="Salvando..."
            successLabel="Configurações salvas"
            errorLabel="Tentar salvar novamente"
            idleIcon={<Save className="w-4 h-4" />}
            className={
              saveSettingsMutation.isError
                ? 'bg-red-600 hover:bg-red-500 text-white px-6 py-2.5'
                : saveSettingsMutation.isSuccess
                  ? 'bg-emerald-600 text-white px-6 py-2.5'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5'
            }
          />
        </div>
      </motion.div>
    </div>
  );
}
