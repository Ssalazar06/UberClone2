import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import useActiveTrip from '../hooks/useActiveTrip.js';
import { TRIP_STATUS } from '../constants/tripStatus.js';
import HomeScreen from '../screens/home/HomeScreen.jsx';
import ActiveTripScreen from '../screens/trip/ActiveTripScreen.jsx';
import TripSummaryScreen from '../screens/trip/TripSummaryScreen.jsx';

const Stack = createNativeStackNavigator();

/**
 * Stack Navigator for the main trip lifecycle.
 * Dynamically switches between HomeScreen (map + incoming 15s request card),
 * ActiveTripScreen (pickup & in-progress navigation), and TripSummaryScreen (payment & receipt)
 * based on the real-time status of the active trip in Firestore.
 */
export default function TripStackNavigator() {
  const { activeTrip } = useActiveTrip();
  const status = activeTrip?.status;

  const isTripInProgress =
    status === TRIP_STATUS.ACCEPTED ||
    status === TRIP_STATUS.DRIVER_ARRIVING ||
    status === TRIP_STATUS.IN_PROGRESS;

  const isTripFinished =
    status === TRIP_STATUS.COMPLETED || status === TRIP_STATUS.PAID;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
      }}
    >
      {isTripFinished ? (
        <Stack.Screen name="TripSummary" component={TripSummaryScreen} />
      ) : isTripInProgress ? (
        <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
      ) : (
        <Stack.Screen name="HomeMap" component={HomeScreen} />
      )}
    </Stack.Navigator>
  );
}

