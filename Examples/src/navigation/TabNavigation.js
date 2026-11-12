import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from "../theme";

//Importamos las pantallas
import ClasesScreen from "../screens/ClasesScreen";
import UserScreen from "../screens/UserScreen";
import HomeScreen from "../screens/HomeScreen";
import ReservasScreen from "../screens/ReservasScreen";

//Importamos Stack de clases
import ClasesStack from "./ClasesStack";

const Tab = createBottomTabNavigator();

export default function TabNavigation() {
    return(
        <Tab.Navigator
            screenOptions = {({route}) =>({
                headerShown: false,
                tabBarActiveTintColor: colors.primario,
                tabBarInactiveTintColor: colors.textoSuave,
                tabBarStyle: {
                    backgroundColor: colors.superficie,
                    paddingBottom: spacing.xs,
                    borderTopWidth: 1,
                    borderTopColor: colors.borde,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                },
                tabBarIcon: ({focused, color, size}) => {
                    let iconName;
                    switch (route.name) {
                        case 'HomeTab':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'ClasesTab':
                            iconName = focused ? 'book' : 'book-outline';
                            break;
                        case 'ReservasTab':
                            iconName = focused ? 'calendar' : 'calendar-outline';
                            break;
                        case 'UserTab':
                            iconName = focused ? 'person' : 'person-outline';
                            break;
                    }
                    return <Ionicons name={iconName} size={size} color={color} />
                }
            })}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen} options={{title: 'Inicio'}} />
            <Tab.Screen name="ClasesTab" component={ClasesStack} options={{title: 'Clases'}} />
            <Tab.Screen name="ReservasTab" component={ReservasScreen} options={{title: 'Reservas'}} />
            <Tab.Screen name="UserTab" component={UserScreen} options={{title: 'Usuario'}} />
        </Tab.Navigator>
    )
}


