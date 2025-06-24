/**
 * @file App.tsx
 * @description Main entry point. Sets up navigation, Redux provider, and demonstrates NativeWind/Tailwind styling.
 */
import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from './store';
import './global.css';
import { supabase } from './src/services/supabase';

const Stack = createNativeStackNavigator();

function HomeScreen() {
  const count = useSelector((state: RootState) => state.counter.value);
  const dispatch = useDispatch();
  const [userResult, setUserResult] = React.useState<string>('');

  React.useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.from('users').select('*').limit(1).single();
      if (error) setUserResult('Error: ' + error.message);
      else if (data) setUserResult('User: ' + JSON.stringify(data));
      else setUserResult('No user found.');
    }
    fetchUser();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="mb-4 text-xl font-bold">Home Screen</Text>
      <Text className="mb-2">Redux Counter: {count}</Text>
      <Pressable
        className="rounded bg-blue-500 px-4 py-2"
        onPress={() => dispatch({ type: 'counter/increment' })}
      >
        <Text className="text-white">Increment</Text>
      </Pressable>
      <Text className="mt-6 max-w-xs text-center text-xs text-gray-500">{userResult}</Text>
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
