import { createContext, useContext, useState, type ReactNode } from "react";
import type { Task } from "shared";

const DRAWER_ANIMATION_DELAY = 150;

interface TaskDrawerContextType {
    isOpen: boolean;
    task: Task | null;
    openDrawer: (task: Task) => void;
    closeDrawer: () => void;
    updateTask: (task: Task) => void;
}

const TaskDrawerContext = createContext<TaskDrawerContextType | undefined>(undefined);

export function TaskDrawerProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [task, setTask] = useState<Task | null>(null);

    const openDrawer = (task: Task) => {
        setTask(task);
        setIsOpen(true);
    };

    const closeDrawer = () => {
        setIsOpen(false);
        setTimeout(() => setTask(null), DRAWER_ANIMATION_DELAY);
    };

    const updateTask = (updatedTask: Task) => {
        setTask(updatedTask);
    };

    return (
        <TaskDrawerContext.Provider
            value={{
                isOpen,
                task,
                openDrawer,
                closeDrawer,
                updateTask,
            }}
        >
            {children}
        </TaskDrawerContext.Provider>
    );
}

export function useTaskDrawer() {
    const context = useContext(TaskDrawerContext);
    if (!context) {
        throw new Error("useTaskDrawer must be used within TaskDrawerProvider");
    }
    return context;
}
