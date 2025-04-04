import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { MemberProvider } from "@/contexts/MemberContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import Project from "./pages/Project";
import NewProject from "./pages/NewProject";
import NotFound from "./pages/NotFound";
import { NavigationProvider } from "./contexts/NavigationContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <NavigationProvider>
          <ProjectProvider>
            <MemberProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Index />} />

                  {/* Protected routes */}
                  <Route
                    path="/projects"
                    element={
                      <AppLayout>
                        <Projects />
                      </AppLayout>
                    }
                  />
                  <Route
                    path="/projects/new"
                    element={
                      <AppLayout>
                        <NewProject />
                      </AppLayout>
                    }
                  />
                  <Route
                    path="/projects/:projectId"
                    element={
                      <AppLayout>
                        <Project />
                      </AppLayout>
                    }
                  />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </MemberProvider>
          </ProjectProvider>
        </NavigationProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
