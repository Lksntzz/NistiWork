import { useDriveStatus, useConnectDrive, useDisconnectDrive } from "@/queries/useGoogleDrive";
import { AlertCircle } from "lucide-react";

const labels = {
  DISCONNECTED: "Desconectado",
  CONNECTING: "Aguardando autorização no navegador…",
  CONNECTED: "Conectado",
  SYNCING: "Sincronizando",
  REAUTH_REQUIRED: "Nova autorização necessária",
  ERROR: "Não foi possível acessar a conexão local",
};

export function GoogleDriveSettings() {
  const { data, isLoading, isError, refetch } = useDriveStatus();
  const connectDrive = useConnectDrive();
  const disconnectDrive = useDisconnectDrive();
  const busy = connectDrive.isPending || disconnectDrive.isPending || data?.status === "CONNECTING";

  if (isLoading) return <div className="text-zinc-500 text-sm">Carregando status...</div>;
  if (isError || !data) {
    return (
      <div className="space-y-2 text-sm text-red-400" role="alert">
        <p>Não foi possível consultar a conexão no aplicativo.</p>
        <button onClick={() => void refetch()} className="underline">Tentar novamente</button>
      </div>
    );
  }
  const connected = data.status === "CONNECTED" || data.status === "SYNCING";
  const canDisconnect = data.status !== "DISCONNECTED" && data.status !== "CONNECTING";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
        <div className="flex-1 min-w-48">
          <h4 className="font-medium text-zinc-300">Google Drive</h4>
          <p className="text-sm text-zinc-500" role="status">{labels[data.status]}</p>
        </div>
        <button
          onClick={() => connectDrive.mutate()}
          disabled={busy}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {connected || data.status === "REAUTH_REQUIRED" ? "Reconectar" : "Conectar Google Drive"}
        </button>
        {canDisconnect && (
          <button
            onClick={() => disconnectDrive.mutate()}
            disabled={busy}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {disconnectDrive.isPending ? "Desconectando…" : "Desconectar"}
          </button>
        )}
      </div>
      {data.message && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400" role="alert">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{data.message}</p>
        </div>
      )}
    </div>
  );
}
