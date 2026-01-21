import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { Task } from "../types";

// Bottom Tab Navigator
export type RootTabParamList = {
    Agent: undefined;
    Tasks: undefined;
    WorkPlanner: undefined;
    Calendar: undefined;
    Chores: undefined;
};

// Stack Navigator for Tasks (shared by Tasks and Planner tabs)
export type TasksStackParamList = {
    TasksList: undefined;
    PlannerMain: undefined;
    TaskDetail: { task: Task };
    TaskForm: { task?: Task; defaultPlannedFor?: string; defaultIsRecurring?: boolean };
};

// Stack Navigator for Calendar
export type CalendarStackParamList = {
    CalendarMain: undefined;
    CalendarDetail: { task: Task };
    TaskForm: { task?: Task; defaultPlannedFor?: string; defaultIsRecurring?: boolean };
};

// Screen props
export type RootTabScreenProps<T extends keyof RootTabParamList> = BottomTabScreenProps<RootTabParamList, T>;

export type TasksStackScreenProps<T extends keyof TasksStackParamList> = CompositeScreenProps<
    NativeStackScreenProps<TasksStackParamList, T>,
    BottomTabScreenProps<RootTabParamList>
>;
