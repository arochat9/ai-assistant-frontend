import { createContext, useContext, useState, type ReactNode } from "react";
import type { Task } from "shared";
import type { CreateTaskInput } from "shared";

interface TaskDialogContextType {
    createOpen: boolean;
    editTask: Task | null;
    createDefaults?: Partial<CreateTaskInput>;
    openCreateDialog: (defaults?: Partial<CreateTaskInput>) => void;
    openEditDialog: (task: Task) => void;
    closeCreateDialog: () => void;
    closeEditDialog: () => void;
}

const TaskDialogContext = createContext<TaskDialogContextType | undefined>(undefined);

export function TaskDialogProvider({ children }: { children: ReactNode }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editTask, setEditTask] = useState<Task | null>(null);
    const [createDefaults, setCreateDefaults] = useState<Partial<CreateTaskInput> | undefined>();

    const openCreateDialog = (defaults?: Partial<CreateTaskInput>) => {
        setCreateDefaults(defaults);
        setCreateOpen(true);
    };
    const closeCreateDialog = () => {
        setCreateOpen(false);
        setCreateDefaults(undefined);
    };

    const openEditDialog = (task: Task) => setEditTask(task);
    const closeEditDialog = () => setEditTask(null);

    return (
        <TaskDialogContext.Provider
            value={{
                createOpen,
                editTask,
                createDefaults,
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
