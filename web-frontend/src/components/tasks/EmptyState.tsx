import { Plus } from "lucide-react";
import { Button } from "../ui/button";

interface EmptyStateProps {
    onCreateTask: () => void;
}

export function EmptyState({ onCreateTask }: EmptyStateProps) {
    return (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
                <p className="mb-2 text-muted-foreground">No tasks found</p>
                <Button onClick={onCreateTask}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first task
                </Button>
            </div>
        </div>
    );
}
