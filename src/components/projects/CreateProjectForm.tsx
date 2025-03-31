
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

export function CreateProjectForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "You must be logged in to create a project",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name,
          description: description || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Set up default statuses for the project
      if (project) {
        const defaultStatuses = [
          { name: "New", display_order: 1, project_id: project.id },
          { name: "In progress", display_order: 2, project_id: project.id },
          { name: "Review", display_order: 3, project_id: project.id },
          { name: "Done", display_order: 4, project_id: project.id },
        ];

        const { error: statusError } = await supabase
          .from("statuses")
          .insert(defaultStatuses);

        if (statusError) throw statusError;

        // Add the creator as a project member with 'owner' role
        const { error: memberError } = await supabase
          .from("project_members")
          .insert({
            project_id: project.id,
            user_id: user.id,
            role: "owner",
          });

        if (memberError) throw memberError;

        // Initialize project progress at 0%
        const { error: progressError } = await supabase
          .from("project_progress")
          .insert({
            project_id: project.id,
            percentage: 0,
          });

        if (progressError) throw progressError;

        toast({
          title: "Project created successfully",
        });

        navigate(`/projects/${project.id}`);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Failed to create project",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Create a new project</h1>
        <p className="text-muted-foreground mt-1">
          Fill in the details to create your project
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter project name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            rows={4}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Project"}
        </Button>
      </form>
    </div>
  );
}
