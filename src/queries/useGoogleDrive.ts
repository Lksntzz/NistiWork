import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import toast from "react-hot-toast";

export interface DriveStatus {
  status: "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "SYNCING" | "REAUTH_REQUIRED" | "ERROR";
  message: string | null;
}

export function useDriveStatus() {
  return useQuery({
    queryKey: ["drive-status"],
    queryFn: async () => {
      return await invoke<DriveStatus>("get_drive_status");
    },
    refetchInterval: 5000 // Polling simples p/ atualizar status
  });
}

export function useConnectDrive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await invoke("connect_google_drive");
    },
    onSuccess: () => {
      toast.success("Google Drive conectado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["drive-status"] });
    },
    onError: (error) => {
      toast.error(`Falha ao conectar: ${error}`);
      queryClient.invalidateQueries({ queryKey: ["drive-status"] });
    }
  });
}

export function useDisconnectDrive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return await invoke<string | null>("disconnect_google_drive");
    },
    onSuccess: (warning) => {
      if (warning) toast(warning);
      else toast.success("Google Drive desconectado!");
      queryClient.invalidateQueries({ queryKey: ["drive-status"] });
    },
    onError: (error) => {
      toast.error(`Falha ao desconectar: ${error}`);
      queryClient.invalidateQueries({ queryKey: ["drive-status"] });
    }
  });
}

