import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AgentScreen } from "./src/screens/AgentScreen";
import { TasksScreen } from "./src/screens/TasksScreen";
import { TaskFormScreen } from "./src/screens/TaskFormScreen";
import { WorkPlannerScreen } from "./src/screens/WorkPlannerScreen";
import { CalendarScreen } from "./src/screens/CalendarScreen";
import { ChoresScreen } from "./src/screens/ChoresScreen";
import { colors } from "./src/theme";
import type { RootTabParamList, TasksStackParamList } from "./src/navigation/types";

const Tab = createBottomTabNavigator<RootTabParamList>();
const TasksStack = createNativeStackNavigator<TasksStackParamList>();

function TasksStackNavigator() {
    return (
        <TasksStack.Navigator screenOptions={{ headerShown: false }}>
            <TasksStack.Screen name="TasksList" component={TasksScreen} />
            <TasksStack.Screen
                name="TaskForm"
                component={TaskFormScreen}
                options={{ animation: "slide_from_right" }}
            />
        </TasksStack.Navigator>
    );
}
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            retry: 2,
        },
    },
});

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <NavigationContainer>
                <Tab.Navigator
                    initialRouteName="Tasks"
                    screenOptions={{
                        headerShown: false,
                        tabBarActiveTintColor: colors.primary,
                        tabBarInactiveTintColor: colors.tabBarInactive,
                        tabBarStyle: {
                            backgroundColor: colors.tabBarBackground,
                            borderTopColor: colors.border,
                        },
                    }}
                >
                    <Tab.Screen
                        name="Agent"
                        component={AgentScreen}
                        options={{ tabBarLabel: "Agent" }}
                    />
                    <Tab.Screen
                        name="Tasks"
                        component={TasksStackNavigator}
                        options={{ tabBarLabel: "Tasks" }}
                    />
                    <Tab.Screen
                        name="WorkPlanner"
                        component={WorkPlannerScreen}
                        options={{ tabBarLabel: "Planner" }}
                    />
                    <Tab.Screen
                        name="Calendar"
                        component={CalendarScreen}
                        options={{ tabBarLabel: "Calendar" }}
                    />
                    <Tab.Screen
                        name="Chores"
                        component={ChoresScreen}
                        options={{ tabBarLabel: "Chores" }}
                    />
                </Tab.Navigator>
                </NavigationContainer>
                <StatusBar style="light" />
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
