import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import toast from "react-hot-toast";

export function useDriveStatus() {
  return useQuery({
    queryKey: ["drive-status"],
    queryFn: async () => {
      return await invoke<string>("get_drive_status");
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
      await invoke("disconnect_google_drive");
    },
    onSuccess: () => {
      toast.success("Google Drive desconectado!");
      queryClient.invalidateQueries({ queryKey: ["drive-status"] });
    },
    onError: (error) => {
      toast.error(`Falha ao desconectar: ${error}`);
      queryClient.invalidateQueries({ queryKey: ["drive-status"] });
    }
  });
}

