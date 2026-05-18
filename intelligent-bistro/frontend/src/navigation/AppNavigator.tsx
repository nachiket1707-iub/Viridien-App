import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MenuScreen from '../screens/MenuScreen';
import ChatScreen from '../screens/ChatScreen';
import CartScreen from '../screens/CartScreen';
import { useStore } from '../store/useStore';
import { Colors } from '../config/theme';

export type RootTabParamList = {
  Menu: undefined;
  Chat: undefined;
  Cart: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function AnimatedBadge({ count, color }: { count: number; color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(count);

  useEffect(() => {
    if (count !== prevCount.current) {
      prevCount.current = count;
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.5, useNativeDriver: true, speed: 40 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }),
      ]).start();
    }
  }, [count, scale]);

  if (count === 0) return null;

  return (
    <Animated.View style={[styles.badge, { backgroundColor: color, transform: [{ scale }] }]}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </Animated.View>
  );
}

export default function AppNavigator() {
  const insets = useSafeAreaInsets();
  const cartCount = useStore((s) => s.cartCount());

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8,
          },
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
          tabBarIcon: ({ color, focused }) => {
            const size = focused ? 26 : 23;
            if (route.name === 'Menu') {
              return <MaterialCommunityIcons name="silverware-fork-knife" size={size} color={color} />;
            }
            if (route.name === 'Chat') {
              return (
                <View>
                  <MaterialCommunityIcons name="robot-excited-outline" size={size} color={color} />
                  <AnimatedBadge count={cartCount} color={Colors.accent} />
                </View>
              );
            }
            if (route.name === 'Cart') {
              return (
                <View>
                  <MaterialCommunityIcons name="cart-outline" size={size} color={color} />
                  <AnimatedBadge count={cartCount} color={Colors.success} />
                </View>
              );
            }
            return null;
          },
        })}
      >
        <Tab.Screen name="Menu" component={MenuScreen} options={{ tabBarLabel: 'Menu' }} />
        <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: 'AI Order' }} />
        <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarLabel: 'Cart' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
});
