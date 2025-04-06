import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeSubscription } from "@/hooks/use-realtimeSubscription";

// Definición del tipo para notificaciones
export type Notification = {
  id: string;
  message: string;
  read: boolean;
  timestamp: string;
  type: "invitation" | "role_change" | "project_update" | "system";
  target_id?: string; // ID del proyecto, miembro, etc. al que se refiere
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Calcular conteo de no leídas
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Cargar notificaciones del usuario desde la BD
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      console.log("Fetching notifications for user:", user.id);

      const { data, error } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data) {
        console.log(`Loaded ${data.length} notifications`);
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [user]);

  // Marcar como leída
  const markAsRead = useCallback(
    async (id: string) => {
      if (!user) return;

      // Actualizar estado local para feedback inmediato
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      // Actualizar en la base de datos
      try {
        const { error } = await supabase
          .from("user_notifications")
          .update({ read: true })
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;
      } catch (error) {
        console.error("Error marking notification as read:", error);
        // Revertir cambio local si falla
        fetchNotifications();
      }
    },
    [user, fetchNotifications]
  );

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    // Actualizar estado local para feedback inmediato
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    // Actualizar en la base de datos
    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .is("read", false); // Solo actualizar las no leídas

      if (error) throw error;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      // Revertir cambio local si falla
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Cargar al iniciar y cuando cambia el usuario
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user, fetchNotifications]);

  // Escuchar cambios en tiempo real en la tabla de notificaciones
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("user_notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("New notification received:", payload);

          // Añadir la nueva notificación al estado
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);

          // Mostrar toast para notificar al usuario
          toast({
            title: "New Notification",
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
