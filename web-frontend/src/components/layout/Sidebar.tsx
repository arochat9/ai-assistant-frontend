import { useState } from "react";
import { NavLink } from "react-router-dom";
import { MessageSquare, ListTodo, Calendar, History, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";

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
        title: "Work Planner",
        href: "/work-planner",
        icon: ClipboardList,
    },
    {
        title: "Calendar",
        href: "/calendar",
        icon: Calendar,
    },
    {
        title: "Changelog",
        href: "/changelog",
        icon: History,
    },
];

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside className={`${isCollapsed ? "w-16" : "w-52"} border-r bg-white transition-all duration-300`}>
            <div className="flex h-full flex-col">
                <div className="p-4 flex items-center justify-between">
                    {!isCollapsed && <h1 className="text-lg font-bold">AI Assistant</h1>}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors ml-auto"
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                        ) : (
                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                        )}
                    </button>
                </div>

                <nav className="flex-1 space-y-1 p-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.href}
                                to={item.href}
                                className={({ isActive }) =>
                                    `flex items-center rounded-lg text-sm font-medium transition-colors ${
                                        isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
                                    } ${
                                        isActive
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`
                                }
                                title={isCollapsed ? item.title : undefined}
                            >
                                <Icon className="h-5 w-5 flex-shrink-0" />
                                {!isCollapsed && <span>{item.title}</span>}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
