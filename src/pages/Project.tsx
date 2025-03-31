
import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProjectDashboard } from "@/components/projects/ProjectDashboard";

export default function Project() {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <AppLayout>
        <div className="p-6">
          <h1 className="text-xl font-bold text-red-500">Project ID is missing</h1>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ProjectDashboard />
    </AppLayout>
  );
}
