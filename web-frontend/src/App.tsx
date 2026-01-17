import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout.tsx";
import { AgentPage } from "./pages/AgentPage.tsx";
import { TasksPage } from "./pages/TasksPage.tsx";
import { WorkPlannerPage } from "./pages/WorkPlannerPage.tsx";
import { CalendarPage } from "./pages/CalendarPage.tsx";
import { TasksChangelogPage } from "./pages/TasksChangelogPage.tsx";
import { Toaster } from "./components/ui/sonner";
import { TaskDrawerProvider } from "./contexts/TaskDrawerContext";
import { TaskDialogProvider } from "./contexts/TaskDialogContext";
import { TaskDrawer } from "./components/task-drawer/TaskDrawer";
import { TaskDialogs } from "./components/task-dialogs/TaskDialogs";

function App() {
    return (
        <TaskDrawerProvider>
            <TaskDialogProvider>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Navigate to="/agent" replace />} />
                        <Route path="/agent" element={<AgentPage />} />
                        <Route path="/tasks" element={<TasksPage />} />
                        <Route path="/work-planner" element={<WorkPlannerPage />} />
                        <Route path="/calendar" element={<CalendarPage />} />
                        <Route path="/changelog" element={<TasksChangelogPage />} />
                    </Routes>
                </Layout>
                <TaskDrawer />
                <TaskDialogs />
                <Toaster />
            </TaskDialogProvider>
        </TaskDrawerProvider>
    );
}

export default App;
