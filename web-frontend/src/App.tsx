import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout.tsx";
import { AgentPage } from "./pages/AgentPage.tsx";
import { TasksPage } from "./pages/TasksPage.tsx";
import { CalendarPage } from "./pages/CalendarPage.tsx";
import { ChoresPage } from "./pages/ChoresPage.tsx";
import { Toaster } from "./components/ui/sonner";

function App() {
    return (
        <>
            <Layout>
                <Routes>
                    <Route path="/" element={<Navigate to="/agent" replace />} />
                    <Route path="/agent" element={<AgentPage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/chores" element={<ChoresPage />} />
                </Routes>
            </Layout>
            <Toaster />
        </>
    );
}

export default App;
