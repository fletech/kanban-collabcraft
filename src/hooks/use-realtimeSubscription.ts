import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Hook personalizado para manejar suscripciones en tiempo real a cambios en Supabase
 *
 * @param table Nombre de la tabla a la que suscribirse
 * @param filterValue Valor del filtro (generalmente projectId)
 * @param filterColumn Columna para filtrar (por defecto: "project_id")
 * @param onDataChange Callback que se ejecuta cuando llegan cambios
 */
export function useRealtimeSubscription(
  table: string,
  filterValue: string | null,
  onDataChange: () => void,
  filterColumn: string = "project_id"
) {
  // Usamos useRef para mantener una referencia estable al callback
  // Esto evita re-suscripciones innecesarias si el callback cambia
  const onChangeRef = useRef(onDataChange);

  // Actualizamos la referencia cuando cambia el callback
  useEffect(() => {
    onChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    if (!filterValue) return;

    const channelName = `${table}_${filterValue}`;
    console.log(
      `Setting up realtime subscription for ${table} with ${filterColumn}=${filterValue}`
    );

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
          filter: `${filterColumn}=eq.${filterValue}`,
        },
        (payload) => {
          console.log(
            `Received realtime update for ${table}:`,
            payload.eventType
          );
          onChangeRef.current();
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${channelName}:`, status);
      });

    return () => {
      console.log(`Cleaning up subscription for ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [table, filterValue, filterColumn]);
}
