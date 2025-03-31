import { AppLayout } from "@/components/layout/AppLayout";
import { CreateProjectForm } from "@/components/projects/CreateProjectForm";

export default function NewProject() {
  return (
    <div className="py-6">
      <CreateProjectForm />
    </div>
  );
}
