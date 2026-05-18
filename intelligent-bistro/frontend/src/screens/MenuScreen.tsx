import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import MenuCard, { MenuItem } from '../components/MenuCard';
import DishDetailModal, { DishDetail } from '../components/DishDetailModal';
import { ENDPOINTS } from '../config/api';
import { Colors, FontSize, Spacing, Radius } from '../config/theme';
import { useStore } from '../store/useStore';
import { RootTabParamList } from '../navigation/AppNavigator';

type Nav = BottomTabNavigationProp<RootTabParamList>;

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

const CATEGORY_FILTERS = ['ALL', 'STARTERS', 'MAINS', 'SIDES', 'DESSERTS', 'DRINKS'];

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const cartCount = useStore((s) => s.cartCount());
  const cartTotal = useStore((s) => s.cartTotal());

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedDish, setSelectedDish] = useState<DishDetail | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => { fetchMenu(); }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(ENDPOINTS.menu);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      setError('Could not load the menu. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useCallback((): MenuItem[] => {
    if (activeFilter === 'ALL') return categories.flatMap((c) => c.items);
    const cat = categories.find(
      (c) => c.name.toUpperCase() === activeFilter || c.id.toUpperCase() === activeFilter,
    );
    return cat ? cat.items : [];
  }, [categories, activeFilter]);

  const items = filteredItems();

  // Header rendered inside FlatList so it scrolls with the content
  const ListHeader = (
    <>
      {/* Hero */}
      <LinearGradient colors={[Colors.surface, Colors.primary]} style={styles.hero}>
        <Text style={styles.restaurantName}>The Intelligent Bistro</Text>
        <Text style={styles.tagline}>Where AI meets Fine Dining</Text>
      </LinearGradient>

      {/* Category filter pills */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORY_FILTERS.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterPill, activeFilter === cat && styles.filterPillActive]}
              onPress={() => { Haptics.selectionAsync(); setActiveFilter(cat); }}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterText, activeFilter === cat && styles.filterTextActive]}>
                {cat === 'ALL' ? 'All Items' : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Section label */}
      {!loading && !error && (
        <Text style={styles.sectionHeader}>
          {activeFilter === 'ALL'
            ? `All Items · ${items.length}`
            : `${activeFilter.charAt(0) + activeFilter.slice(1).toLowerCase()} · ${items.length}`}
        </Text>
      )}
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {loading ? (
        <>
          {ListHeader}
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.loadingText}>Loading the menu...</Text>
          </View>
        </>
      ) : error ? (
        <>
          {ListHeader}
          <View style={styles.centered}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchMenu}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.listContent,
            cartCount > 0 && { paddingBottom: 90 },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No items in this category.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <MenuCard
                item={item}
                onPress={(dish) => {
                  setSelectedDish(dish as DishDetail);
                  setModalVisible(true);
                }}
              />
            </View>
          )}
        />
      )}

      {/* Floating cart CTA */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={[styles.floatingCart, { bottom: insets.bottom + 2 }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Cart'); }}
          activeOpacity={0.9}
        >
          <Text style={styles.floatingCartText}>
            🛒  View Cart ({cartCount}) · ${cartTotal.toFixed(2)}
          </Text>
        </TouchableOpacity>
      )}

      <DishDetailModal
        dish={selectedDish}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  restaurantName: {
    color: Colors.accent,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 4,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  filterContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.textDark,
    fontWeight: '700',
  },
  sectionHeader: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  row: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  cardWrapper: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
    minHeight: 200,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginTop: Spacing.sm,
  },
  errorEmoji: {
    fontSize: 40,
  },
  errorText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  retryText: {
    color: Colors.textDark,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
  floatingCart: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingCartText: {
    color: Colors.textDark,
    fontWeight: '800',
    fontSize: FontSize.md,
  },
});
