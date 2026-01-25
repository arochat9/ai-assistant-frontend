import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AgentScreen } from "./src/screens/AgentScreen";
import { TasksScreen } from "./src/screens/TasksScreen";
import { TaskDetailScreen } from "./src/screens/TaskDetailScreen";
import { TaskFormScreen } from "./src/screens/TaskFormScreen";
import { WorkPlannerScreen } from "./src/screens/WorkPlannerScreen";
import { CalendarScreen } from "./src/screens/CalendarScreen";
import { ChangelogScreen } from "./src/screens/ChangelogScreen";
import { colors } from "./src/theme";
import type { RootTabParamList, TasksStackParamList, CalendarStackParamList } from "./src/navigation/types";

const Tab = createBottomTabNavigator<RootTabParamList>();
const TasksStack = createNativeStackNavigator<TasksStackParamList>();
const PlannerStack = createNativeStackNavigator<TasksStackParamList>();
const CalendarStack = createNativeStackNavigator<CalendarStackParamList>();
const ChangelogStack = createNativeStackNavigator<TasksStackParamList>();

function TasksStackNavigator() {
    return (
        <TasksStack.Navigator screenOptions={{ headerShown: false }}>
            <TasksStack.Screen name="TasksList" component={TasksScreen} />
            <TasksStack.Screen
                name="TaskDetail"
                component={TaskDetailScreen}
                options={{ animation: "slide_from_right" }}
            />
            <TasksStack.Screen
                name="TaskForm"
                component={TaskFormScreen}
                options={{ animation: "slide_from_right" }}
            />
        </TasksStack.Navigator>
    );
}

function PlannerStackNavigator() {
    return (
        <PlannerStack.Navigator screenOptions={{ headerShown: false }}>
            <PlannerStack.Screen name="PlannerMain" component={WorkPlannerScreen} />
            <PlannerStack.Screen
                name="TaskDetail"
                component={TaskDetailScreen}
                options={{ animation: "slide_from_right" }}
            />
            <PlannerStack.Screen
                name="TaskForm"
                component={TaskFormScreen}
                options={{ animation: "slide_from_right" }}
            />
        </PlannerStack.Navigator>
    );
}

function CalendarStackNavigator() {
    return (
        <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
            <CalendarStack.Screen name="CalendarMain" component={CalendarScreen} />
            <CalendarStack.Screen
                name="CalendarDetail"
                component={TaskDetailScreen}
                options={{ animation: "slide_from_right" }}
            />
            <CalendarStack.Screen
                name="TaskForm"
                component={TaskFormScreen}
                options={{ animation: "slide_from_right" }}
            />
        </CalendarStack.Navigator>
    );
}

function ChangelogStackNavigator() {
    return (
        <ChangelogStack.Navigator screenOptions={{ headerShown: false }}>
            <ChangelogStack.Screen name="ChangelogMain" component={ChangelogScreen} />
            <ChangelogStack.Screen
                name="TaskDetail"
                component={TaskDetailScreen}
                options={{ animation: "slide_from_right" }}
            />
        </ChangelogStack.Navigator>
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
                        tabBarActiveTintColor: "#ffffff",
                        tabBarInactiveTintColor: "#ffffff",
                        tabBarShowLabel: false,
                        tabBarStyle: {
                            backgroundColor: colors.tabBarBackground,
                            borderTopColor: colors.border,
                            paddingTop: 8,
                        },
                    }}
                >
                    <Tab.Screen
                        name="Agent"
                        component={AgentScreen}
                        options={{
                            tabBarIcon: ({ focused, size }) => (
                                <Ionicons name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} size={size} color="#ffffff" />
                            ),
                        }}
                    />
                    <Tab.Screen
                        name="Tasks"
                        component={TasksStackNavigator}
                        options={{
                            tabBarIcon: ({ focused, size }) => (
                                <Ionicons name={focused ? "checkbox" : "checkbox-outline"} size={size} color="#ffffff" />
                            ),
                        }}
                    />
                    <Tab.Screen
                        name="WorkPlanner"
                        component={PlannerStackNavigator}
                        options={{
                            tabBarIcon: ({ focused, size }) => (
                                <Ionicons name={focused ? "list" : "list-outline"} size={size} color="#ffffff" />
                            ),
                        }}
                    />
                    <Tab.Screen
                        name="Calendar"
                        component={CalendarStackNavigator}
                        options={{
                            tabBarIcon: ({ focused, size }) => (
                                <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size} color="#ffffff" />
                            ),
                        }}
                    />
                    <Tab.Screen
                        name="Changelog"
                        component={ChangelogStackNavigator}
                        options={{
                            tabBarIcon: ({ focused, size }) => (
                                <Ionicons name={focused ? "time" : "time-outline"} size={size} color="#ffffff" />
                            ),
                        }}
                    />
                </Tab.Navigator>
                </NavigationContainer>
                <StatusBar style="light" />
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
