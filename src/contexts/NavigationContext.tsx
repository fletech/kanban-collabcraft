import { createContext, useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProjectIdFromPath } from "@/hooks/use-projectId";

type NavigationContextType = {
  currentProjectId: string | null;
  navigateToProject: (projectId: string) => void;
  navigateToDashboard: () => void;
  navigateToAllProjects: () => void;
  navigateToNewProject: () => void;
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

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(
    paramProjectId || pathProjectId
  );
  const navigate = useNavigate();

  // Actualizar currentProjectId cuando cambia la URL
  useEffect(() => {
    const urlProjectId = paramProjectId || pathProjectId;
    if (urlProjectId && urlProjectId !== currentProjectId) {
      setCurrentProjectId(urlProjectId);
    }
  }, [paramProjectId, currentProjectId]);

  const navigateToProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
    setCurrentProjectId(projectId);
  };

  const navigateToDashboard = () => {
    navigate("/projects");
  };

  const navigateToAllProjects = () => {
    navigate("/projects");
  };

  const navigateToNewProject = () => {
    navigate("/projects/new");
  };

  return (
    <NavigationContext.Provider
      value={{
        currentProjectId,
        navigateToProject,
        navigateToDashboard,
        navigateToAllProjects,
        navigateToNewProject,
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
