import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, Star, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  is_owner: boolean;
}

const ProjectCard = ({ project }: { project: Project }) => {
  const formattedDate = new Date(project.created_at || "").toLocaleDateString(
    "es-ES",
    {
      day: "numeric",
      month: "short",
    }
  );

  return (
    <Link to={`/projects/${project.id}`} className="group relative">
      <Card
        className={cn(
          "flex flex-col h-32 transition-all duration-200",
          "hover:shadow-lg hover:scale-[1.02] hover:border-blue-200",
          "bg-gradient-to-br from-white to-gray-50/80"
        )}
      >
        <CardHeader className="p-4 pb-2 flex-grow">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "p-2 rounded-md",
                  project.is_owner ? "bg-blue-500/10" : "bg-gray-500/10"
                )}
              >
                {project.is_owner ? (
                  <Star className="h-4 w-4 text-blue-500" />
                ) : (
                  <Users className="h-4 w-4 text-gray-500" />
                )}
              </div>
              <div>
                <CardTitle className="text-sm font-medium">
                  {project.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {project.is_owner ? "Owner" : "Collaborator"}
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {formattedDate}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {project.description || "No description provided"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("projects")
          .select("id, name, description, created_at, created_by")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const projectsWithOwnership = (data || []).map((project) => ({
          ...project,
          is_owner: project.created_by === user.id,
        }));

        setProjects(projectsWithOwnership);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const ownedProjects = projects.filter((p) => p.is_owner);
  const collaborativeProjects = projects.filter((p) => !p.is_owner);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {projects.length > 0 ? (
        <div className="space-y-8">
          {ownedProjects.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-blue-500" />
                My Projects
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ownedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          )}

          {collaborativeProjects.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-500" />
                Collaborative Projects
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {collaborativeProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-blue-500/10 p-4 rounded-full mb-4">
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create your first project to start organizing your tasks and track
            progress
          </p>
          <Button asChild>
            <Link to="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
