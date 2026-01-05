import { TaskCreateDialog } from "./TaskCreateDialog";
import { TaskEditDialog } from "./TaskEditDialog";
import { useTaskDialog } from "../../contexts/TaskDialogContext";
import { useTaskMutations } from "../../hooks/useTaskMutations";

export function TaskDialogs() {
    const { createOpen, editTask, closeCreateDialog, closeEditDialog } = useTaskDialog();

    const { createMutation, updateMutation } = useTaskMutations({
        filters: {},
        onCreateSuccess: closeCreateDialog,
        onUpdateSuccess: closeEditDialog,
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
