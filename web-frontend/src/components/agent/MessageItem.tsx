import { Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { Message, ToolInvocation } from "ai";
import { Streamdown } from "streamdown";

interface MessageItemProps {
    message: Message;
}

function ToolInvocationCard({ toolInvocation }: { toolInvocation: ToolInvocation }) {
    const { toolName, args, state } = toolInvocation;
    const isComplete = state === "result";
    const result = isComplete ? (toolInvocation as ToolInvocation & { state: "result" }).result : null;
    const hasError = result?.error || (result && typeof result === "object" && "error" in result);

    const toolDisplayNames: Record<string, string> = {
        getTasks: "Fetching tasks",
        getTaskDetails: "Getting task details",
        createTask: "Creating task",
        updateTask: "Updating task",
    };

    const displayName = toolDisplayNames[toolName] || toolName;

    return (
        <div className="my-2 rounded-lg border bg-muted/50 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium">
                {isComplete ? (
                    hasError ? (
                        <XCircle className="size-4 text-destructive" />
                    ) : (
                        <CheckCircle2 className="size-4 text-green-600" />
                    )
                ) : (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                )}
                <span>{displayName}</span>
                {isComplete && !hasError && <span className="text-xs text-muted-foreground">Done</span>}
            </div>
            {toolName === "createTask" && args && (
                <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">{String((args as Record<string, unknown>).taskName ?? "")}</span>
                    {Boolean((args as Record<string, unknown>).isRecurring) && <span className="ml-2">(recurring)</span>}
                    {Boolean((args as Record<string, unknown>).subType) && (
                        <span className="ml-2">• {String((args as Record<string, unknown>).subType)}</span>
                    )}
                </div>
            )}
            {toolName === "updateTask" && args && (
                <div className="mt-2 text-xs text-muted-foreground">
                    {Boolean((args as Record<string, unknown>).taskName) && (
                        <span className="font-medium">{String((args as Record<string, unknown>).taskName)}</span>
                    )}
                    {Boolean((args as Record<string, unknown>).status) && (
                        <span className="ml-2">→ {String((args as Record<string, unknown>).status)}</span>
                    )}
                </div>
            )}
            {hasError && (
                <div className="mt-2 text-xs text-destructive">
                    {typeof result === "object" && result && "error" in result
                        ? String((result as Record<string, unknown>).error)
                        : "An error occurred"}
                </div>
            )}
        </div>
    );
}

// Don't memo - toolInvocations state changes need to trigger re-renders
export function MessageItem({ message }: MessageItemProps) {
    const toolInvocations = message.toolInvocations ?? [];

    return (
        <div className="group/message fade-in w-full animate-in duration-200" data-role={message.role}>
            <div
                className={`flex w-full items-start gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
                {message.role === "assistant" && (
                    <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
                        <Sparkles className="size-4" />
                    </div>
                )}

                <div
                    className={`flex flex-col ${
                        message.role === "user" ? "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]" : "w-full"
                    }`}
                >
                    {message.role === "user" ? (
                        <div className="w-fit rounded-2xl bg-zinc-800 px-3 py-2 text-zinc-100 text-sm">
                            {message.content}
                        </div>
                    ) : (
                        <>
                            {toolInvocations.map((invocation) => (
                                <ToolInvocationCard key={invocation.toolCallId} toolInvocation={invocation} />
                            ))}
                            {message.content && (
                                <Streamdown className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto">
                                    {message.content}
                                </Streamdown>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
