import { useParams } from "react-router-dom";

/**
 * Obtiene el ID del proyecto directamente del pathname (sin hooks)
 */
export function getProjectIdFromPath(): string | null {
  const path = window.location.pathname;
  const match = path.match(/\/projects\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Hook para obtener el ID del proyecto actual
 * Prioriza useParams, con fallback a pathname
 */
export function useProjectId() {
  const { projectId } = useParams<{ projectId: string }>();
  return projectId || getProjectIdFromPath();
}
