import { NavLink } from "react-router-dom";
import { MessageSquare, ListTodo, Calendar, RefreshCw } from "lucide-react";

const navItems = [
    {
        title: "Agent",
        href: "/agent",
        icon: MessageSquare,
    },
    {
        title: "Tasks",
        href: "/tasks",
        icon: ListTodo,
    },
    {
        title: "Calendar",
        href: "/calendar",
        icon: Calendar,
    },
    {
        title: "Chores",
        href: "/chores",
        icon: RefreshCw,
    },
];

export function Sidebar() {
    return (
        <aside className="w-64 border-r bg-white">
            <div className="flex h-full flex-col">
                <div className="border-b p-6">
                    <h1 className="text-xl font-bold">AI Assistant</h1>
                </div>

                <nav className="flex-1 space-y-1 p-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.href}
                                to={item.href}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                        isActive
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`
                                }
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.title}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
