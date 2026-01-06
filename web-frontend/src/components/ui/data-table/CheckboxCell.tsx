import { Check, Minus } from "lucide-react";
import type { ReactNode } from "react";

interface CheckboxCellProps {
    status: "Open" | "Closed" | "Backlogged";
    onToggle: () => void;
}

export function CheckboxCell({ status, onToggle }: CheckboxCellProps): ReactNode {
    return (
        <div className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
                className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-colors ${
                    status === "Closed"
                        ? "bg-green-500 border-green-500"
                        : status === "Backlogged"
                        ? "bg-orange-500 border-orange-500"
                        : "bg-white border-gray-300 hover:border-gray-400"
                }`}
                type="button"
            >
                {status === "Closed" && <Check className="w-4 h-4 text-white" />}
                {status === "Backlogged" && <Minus className="w-4 h-4 text-white" />}
            </button>
        </div>
    );
}
