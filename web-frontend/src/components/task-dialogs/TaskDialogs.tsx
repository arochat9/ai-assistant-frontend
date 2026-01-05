import { TaskCreateDialog } from "./TaskCreateDialog";
import { TaskEditDialog } from "./TaskEditDialog";
import { useTaskDialog } from "../../contexts/TaskDialogContext";
import { useTaskDrawer } from "../../contexts/TaskDrawerContext";
import { useTaskMutations } from "../../hooks/useTaskMutations";
import type { Task } from "shared";

export function TaskDialogs() {
    const { createOpen, editTask, closeCreateDialog, closeEditDialog } = useTaskDialog();
    const { updateTask: updateDrawerTask } = useTaskDrawer();

    const handleUpdateSuccess = (task?: Task) => {
        closeEditDialog();
        if (task) {
            updateDrawerTask(task);
        }
    };

    const { createMutation, updateMutation } = useTaskMutations({
        filters: {},
        onCreateSuccess: closeCreateDialog,
        onUpdateSuccess: handleUpdateSuccess,
    });

    return (
        <>
            <TaskCreateDialog
                open={createOpen}
                onOpenChange={closeCreateDialog}
                onSubmit={createMutation.mutate}
                isLoading={createMutation.isPending}
            />

            {editTask && (
                <TaskEditDialog
                    open={!!editTask}
                    onOpenChange={(open) => !open && closeEditDialog()}
                    onSubmit={updateMutation.mutate}
                    isLoading={updateMutation.isPending}
                    task={editTask}
                />
            )}
        </>
    );
}
