// FormTabsLayout.js
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FormPage from './formPage';
import MapScreen from './map';
import RecordsScreen from './records';

const Tab = createBottomTabNavigator();

export default function FormTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarLabelPosition: 'below-icon',
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',

        tabBarStyle: {
          height: (Platform.OS === 'ios' ? 64 : 60) + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(8, insets.bottom),
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarIconStyle: { marginTop: 2 },
        tabBarLabelStyle: { marginBottom: 2 },

        headerShown: false,

        tabBarIcon: ({ focused, color, size }) => {
          let name;
          switch (route.name) {
            case 'Form':
              name = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Records':
              name = focused ? 'albums' : 'albums-outline';
              break;
            case 'Map':
              name = focused ? 'map' : 'map-outline';
              break;
            default:
              name = 'ellipse';
          }
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Form" component={FormPage} />
      <Tab.Screen name="Records" component={RecordsScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
    </Tab.Navigator>
  );
}
