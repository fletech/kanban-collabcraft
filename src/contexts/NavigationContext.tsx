import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getProjectIdFromPath } from "@/hooks/use-projectId";

type NavigationContextType = {
  currentProjectId: string | null;
  navigateToProject: (projectId: string) => void;
  navigateToDashboard: () => void;
  navigateToAllProjects: () => void;
  navigateToNewProject: () => void;
  isNavigating: boolean;
};

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { projectId: paramProjectId } = useParams<{ projectId: string }>();
  const pathProjectId = getProjectIdFromPath();
  const location = useLocation();

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(
    paramProjectId || pathProjectId
  );
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Actualizar currentProjectId cuando cambia la URL
  useEffect(() => {
    const urlProjectId = paramProjectId || pathProjectId;
    if (urlProjectId && urlProjectId !== currentProjectId) {
      setCurrentProjectId(urlProjectId);
    }

    // Resetear el estado de navegación cuando se completa
    setIsNavigating(false);

    // Limpiar cualquier timeout pendiente
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, [paramProjectId, pathProjectId, location.pathname, currentProjectId]);

  const navigateToProject = useCallback(
    (projectId: string) => {
      if (projectId === currentProjectId && !isNavigating) {
        return; // Ya estamos en este proyecto y no estamos navegando
      }

      // Marcar que estamos navegando - esto puede usarse en otros componentes
      setIsNavigating(true);
      setCurrentProjectId(projectId);

      // Navegar a la ruta
      navigate(`/projects/${projectId}`);
    },
    [navigate, currentProjectId, isNavigating]
  );

  const navigateToDashboard = useCallback(() => {
    setIsNavigating(true);
    navigate("/projects");
  }, [navigate]);

  const navigateToAllProjects = useCallback(() => {
    setIsNavigating(true);
    navigate("/projects");
  }, [navigate]);

  const navigateToNewProject = useCallback(() => {
    setIsNavigating(true);
    navigate("/projects/new");
  }, [navigate]);

  // Limpiar estado al desmontar
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        currentProjectId,
        navigateToProject,
        navigateToDashboard,
        navigateToAllProjects,
        navigateToNewProject,
        isNavigating,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};
