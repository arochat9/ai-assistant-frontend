import { useQuery } from "@tanstack/react-query";
import { messagesApi } from "../../services/api";

export function MessagesMetrics() {
    const { data, isLoading } = useQuery({
        queryKey: ["messagesMetrics"],
        queryFn: () => messagesApi.getMetrics(),
        staleTime: 60000,
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-3 gap-3 mb-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-3 bg-muted/20 animate-pulse h-16" />
                ))}
            </div>
        );
    }

    const metrics = data?.metrics;
    if (!metrics) return null;

    const periods = [
        { label: "Last 7 days", count: metrics.sentThisWeek, top: metrics.mostActiveWeek },
        { label: "Last 30 days", count: metrics.sentThisMonth, top: metrics.mostActiveMonth },
        { label: "Last year", count: metrics.sentThisYear, top: metrics.mostActiveYear },
    ];

    return (
        <div className="grid grid-cols-3 gap-3 mb-6">
            {periods.map((p) => (
                <div key={p.label} className="border rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs text-muted-foreground">{p.label}</p>
                        <p className="text-xl font-bold">{p.count.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">messages</span></p>
                    </div>
                    {p.top && (
                        <div className="text-right shrink-0">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Most active</p>
                            <p className="text-sm font-medium">{p.top.displayName} ({p.top.messageCount.toLocaleString()})</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
