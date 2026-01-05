import { createContext, useContext, useState, type ReactNode } from "react";
import type { Task } from "shared";

interface TaskDialogContextType {
    createOpen: boolean;
    editTask: Task | null;
    openCreateDialog: () => void;
    openEditDialog: (task: Task) => void;
    closeCreateDialog: () => void;
    closeEditDialog: () => void;
}

const TaskDialogContext = createContext<TaskDialogContextType | undefined>(undefined);

export function TaskDialogProvider({ children }: { children: ReactNode }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editTask, setEditTask] = useState<Task | null>(null);

    const openCreateDialog = () => setCreateOpen(true);
    const closeCreateDialog = () => setCreateOpen(false);

    const openEditDialog = (task: Task) => setEditTask(task);
    const closeEditDialog = () => setEditTask(null);

    return (
        <TaskDialogContext.Provider
            value={{
                createOpen,
                editTask,
                openCreateDialog,
                openEditDialog,
                closeCreateDialog,
                closeEditDialog,
            }}
        >
            {children}
        </TaskDialogContext.Provider>
    );
}

export function useTaskDialog() {
    const context = useContext(TaskDialogContext);
    if (!context) {
        throw new Error("useTaskDialog must be used within TaskDialogProvider");
    }
    return context;
}
