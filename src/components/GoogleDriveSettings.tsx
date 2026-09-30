import { ActionButton, type ActionState } from '@/components/ui/ActionButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDriveStatus, useConnectDrive, useDisconnectDrive } from '@/queries/useGoogleDrive';
import { AlertCircle, CheckCircle2, Cloud, RefreshCw, Unplug } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export function GoogleDriveSettings() {
  const { data: status, isLoading } = useDriveStatus();
  const connectDrive = useConnectDrive();
  const disconnectDrive = useDisconnectDrive();
  const reduceMotion = useReducedMotion();

  if (isLoading) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-4" aria-label="Carregando status do Google Drive">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
    );
  }

  const isConnected = status === 'CONNECTED' || status === 'SYNCING';
  const isSyncing = status === 'SYNCING';
  const needsReauth = status === 'REAUTH_REQUIRED';
  const isConnecting = status === 'CONNECTING';
  const isError = status?.startsWith('ERROR');

  const connectState: ActionState = connectDrive.isPending || isConnecting
    ? 'loading'
    : connectDrive.isError
      ? 'error'
      : connectDrive.isSuccess && isConnected
        ? 'success'
        : 'idle';

  const disconnectState: ActionState = disconnectDrive.isPending
    ? 'loading'
    : disconnectDrive.isError
      ? 'error'
      : 'idle';

  const statusLabel = isSyncing
    ? 'Sincronizando'
    : status === 'CONNECTED'
      ? 'Conectado'
      : isConnecting
        ? 'Conectando'
        : needsReauth
          ? 'Reconexão necessária'
          : isError
            ? 'Erro de conexão'
            : status || 'Desconectado';

  return (
    <div className="space-y-4">
      <motion.div
        layout
        className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg"
      >
        <div className="flex items-center gap-3 flex-1 mr-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
            {isSyncing ? (
              <motion.span
                animate={reduceMotion ? undefined : { rotate: 360 }}
                transition={reduceMotion ? undefined : { duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="h-4 w-4 text-indigo-400" />
              </motion.span>
            ) : isConnected ? (
              <motion.span
                initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </motion.span>
            ) : isError || needsReauth ? (
              <AlertCircle className="h-4 w-4 text-red-400" />
            ) : (
              <Cloud className="h-4 w-4 text-zinc-500" />
            )}
          </div>

          <div className="min-w-0">
            <h4 className="font-medium text-zinc-300">Status</h4>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={statusLabel}
                initial={reduceMotion ? false : { opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
                transition={{ duration: 0.14 }}
                className={
                  isSyncing
                    ? 'text-sm text-indigo-400'
                    : isConnected
                      ? 'text-sm text-emerald-400'
                      : isError || needsReauth
                        ? 'text-sm text-red-400'
                        : 'text-sm text-zinc-500'
                }
              >
                {statusLabel}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {!isConnected && !needsReauth && !isConnecting && (
          <ActionButton
            onClick={() => connectDrive.mutate()}
            state={connectState}
            idleLabel="Conectar Google Drive"
            loadingLabel="Conectando..."
            successLabel="Conectado"
            errorLabel="Tentar novamente"
            idleIcon={<Cloud className="h-4 w-4" />}
            className={
              connectDrive.isError
                ? 'bg-red-600 hover:bg-red-500 text-white px-4 py-2'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2'
            }
          />
        )}

        {(isConnected || needsReauth) && (
          <ActionButton
            onClick={() => disconnectDrive.mutate()}
            state={disconnectState}
            idleLabel="Desconectar"
            loadingLabel="Desconectando..."
            errorLabel="Tentar desconectar"
            idleIcon={<Unplug className="h-4 w-4" />}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2"
          />
        )}

        {isConnecting && !connectDrive.isPending && (
          <div className="flex items-center gap-2 px-4 py-2 text-indigo-400 text-sm font-medium">
            <motion.span
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={reduceMotion ? undefined : { duration: 0.85, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="h-4 w-4" />
            </motion.span>
            Conectando...
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {needsReauth && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-red-400">Reautenticação necessária</h5>
                <p className="text-sm text-red-400/80 mt-1">
                  A sessão expirou ou o acesso foi revogado. Conecte novamente.
                </p>
                <ActionButton
                  onClick={() => connectDrive.mutate()}
                  state={connectState}
                  idleLabel="Reconectar"
                  loadingLabel="Reconectando..."
                  successLabel="Reconectado"
                  errorLabel="Tentar novamente"
                  className="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-1.5"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
