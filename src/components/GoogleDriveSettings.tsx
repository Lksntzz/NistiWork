import { useDriveStatus, useConnectDrive, useDisconnectDrive } from "@/queries/useGoogleDrive";
import { AlertCircle } from "lucide-react";

export function GoogleDriveSettings() {
  const { data: status, isLoading } = useDriveStatus();
  const connectDrive = useConnectDrive();
  const disconnectDrive = useDisconnectDrive();

  if (isLoading) {
    return <div className="text-zinc-500 text-sm">Carregando status...</div>;
  }

  const isConnected = status === "CONNECTED" || status === "SYNCING";
  const needsReauth = status === "REAUTH_REQUIRED";
  const isConnecting = status === "CONNECTING";
  const isError = status?.startsWith("ERROR");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
        <div className="flex-1 mr-4">
          <h4 className="font-medium text-zinc-300">Status</h4>
          <p className="text-sm text-zinc-500 line-clamp-2">{status}</p>
        </div>
        
        {(!isConnected && !needsReauth && !isConnecting) && (
          <button
            onClick={() => connectDrive.mutate()}
            disabled={connectDrive.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Conectar Google Drive
          </button>
        )}

        {(isConnected || needsReauth) && (
          <button
            onClick={() => disconnectDrive.mutate()}
            disabled={disconnectDrive.isPending}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Desconectar
          </button>
        )}
        
        {isConnecting && (
          <div className="px-4 py-2 text-indigo-400 text-sm font-medium">Conectando...</div>
        )}
      </div>

      {needsReauth && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-sm font-medium text-red-400">Reautenticao Necessria</h5>
            <p className="text-sm text-red-400/80 mt-1">A sesso expirou ou o acesso foi revogado. Por favor, conecte novamente.</p>
            <button
              onClick={() => connectDrive.mutate()}
              disabled={connectDrive.isPending}
              className="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
            >
              Reconectar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
