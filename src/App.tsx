import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { MemberProvider } from "@/contexts/MemberContext";
import { DocumentProvider } from "@/contexts/DocumentContext";
import { AnalysisProvider } from "@/contexts/AnalysisContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import Project from "./pages/Project";
import NewProject from "./pages/NewProject";
import NotFound from "./pages/NotFound";
import { NavigationProvider } from "./contexts/NavigationContext";
import { NotificationProvider } from "./contexts/NotificationContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <NavigationProvider>
            <ProjectProvider>
              <MemberProvider>
                <DocumentProvider>
                  <AnalysisProvider>
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
                  </AnalysisProvider>
                </DocumentProvider>
              </MemberProvider>
            </ProjectProvider>
          </NavigationProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
