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

// Stack Navigator for Tasks
export type TasksStackParamList = {
    TasksList: undefined;
    TaskForm: { task?: Task };
};

// Screen props
export type RootTabScreenProps<T extends keyof RootTabParamList> = BottomTabScreenProps<RootTabParamList, T>;

export type TasksStackScreenProps<T extends keyof TasksStackParamList> = CompositeScreenProps<
    NativeStackScreenProps<TasksStackParamList, T>,
    BottomTabScreenProps<RootTabParamList>
>;
