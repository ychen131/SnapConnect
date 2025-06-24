/**
 * @file App.tsx
 * @description Main entry point. Sets up navigation, Redux provider, and demonstrates NativeWind/Tailwind styling.
 */
import React from "react";
import { Text, View, Pressable } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store, RootState } from "./store";
import "./global.css";

const Stack = createNativeStackNavigator();

function HomeScreen() {
  const count = useSelector((state: RootState) => state.counter.value);
  const dispatch = useDispatch();
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold mb-4">Home Screen</Text>
      <Text className="mb-2">Redux Counter: {count}</Text>
      <Pressable
        className="bg-blue-500 px-4 py-2 rounded"
        onPress={() => dispatch({ type: "counter/increment" })}
      >
        <Text className="text-white">Increment</Text>
      </Pressable>
    </View>
  );
}

function DetailsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold">Details Screen</Text>
    </View>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Details" component={DetailsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
