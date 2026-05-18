import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Animated,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { Colors, FontSize, Spacing, Radius } from '../config/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface DishDetail {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  emoji?: string;
  description: string;
  dietary: string[];
  category: string;
  calories: number;
  prepTime: string;
  allergens: string[];
  nutrition: { protein: number; carbs: number; fat: number };
  pairingNote: string;
}

interface Props {
  dish: DishDetail | null;
  visible: boolean;
  onClose: () => void;
}

// Colorblind-friendly palette for dietary labels
const DIETARY_INFO: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  vegetarian:    { label: 'Vegetarian',   icon: 'leaf',          color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  vegan:         { label: 'Vegan',        icon: 'sprout',        color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  'gluten-free': { label: 'Gluten-Free',  icon: 'grain',         color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  'chefs-special':{ label: "Chef's Pick", icon: 'star-four-points', color: Colors.accent, bg: 'rgba(232,160,32,0.12)' },
};

function StatPill({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DishDetailModal({ dish, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const addToCart = useStore((s) => s.addToCart);
  const cartItems = useStore((s) => s.cartItems);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (visible) {
      setImgError(false);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 3, speed: 14 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!dish) return null;

  const inCartQty = cartItems.find((c) => c.id === dish.id)?.quantity ?? 0;
  const showImage = dish.imageUrl && !imgError;

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addToCart({ id: dish.id, name: dish.name, price: dish.price, quantity: 1, category: dish.category });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

      <Animated.View
        style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.md, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Hero image */}
        {showImage ? (
          <ImageBackground
            source={{ uri: dish.imageUrl }}
            style={styles.hero}
            imageStyle={styles.heroImage}
            onError={() => setImgError(true)}
          >
            <LinearGradient
              colors={['rgba(9,9,15,0.15)', 'rgba(9,9,15,0.75)', Colors.primary]}
              locations={[0, 0.65, 1]}
              style={styles.heroGradient}
            />
            <TouchableOpacity style={[styles.closeBtn, { top: insets.top + 12 }]} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={18} color={Colors.textMain} />
            </TouchableOpacity>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{dish.category}</Text>
            </View>
          </ImageBackground>
        ) : (
          <View style={styles.heroFallback}>
            <LinearGradient colors={[Colors.card, Colors.primary]} style={StyleSheet.absoluteFillObject} />
            <Text style={styles.heroEmojiFallback}>{dish.emoji ?? '🍽️'}</Text>
            <TouchableOpacity style={[styles.closeBtn, { top: insets.top + 12 }]} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={18} color={Colors.textMain} />
            </TouchableOpacity>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{dish.category}</Text>
            </View>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.body}
          bounces={false}
        >
          {/* Title + price */}
          <View style={styles.titleRow}>
            <Text style={styles.dishName}>{dish.name}</Text>
            <Text style={styles.dishPrice}>${dish.price.toFixed(2)}</Text>
          </View>

          {/* Dietary badges */}
          {dish.dietary.length > 0 && (
            <View style={styles.dietaryRow}>
              {dish.dietary.map((tag) => {
                const d = DIETARY_INFO[tag];
                if (!d) return null;
                return (
                  <View key={tag} style={[styles.dietaryBadge, { borderColor: d.color + '55', backgroundColor: d.bg }]}>
                    <MaterialCommunityIcons name={d.icon as any} size={12} color={d.color} />
                    <Text style={[styles.dietaryLabel, { color: d.color }]}>{d.label}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Description */}
          <Text style={styles.description}>{dish.description}</Text>

          {/* Quick info row */}
          <View style={styles.quickInfo}>
            <View style={styles.quickChip}>
              <MaterialCommunityIcons name="fire" size={14} color={Colors.accent} />
              <Text style={styles.quickChipText}>
                {dish.calories > 0 ? `${dish.calories} kcal` : 'No calories'}
              </Text>
            </View>
            <View style={styles.quickChip}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.accent} />
              <Text style={styles.quickChipText}>{dish.prepTime}</Text>
            </View>
          </View>

          {/* Nutrition stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition per serving</Text>
            <View style={styles.statsRow}>
              <StatPill label="Protein" value={dish.nutrition.protein} unit="g" />
              <StatPill label="Carbs" value={dish.nutrition.carbs} unit="g" />
              <StatPill label="Fat" value={dish.nutrition.fat} unit="g" />
              <StatPill label="kcal" value={dish.calories} unit="" />
            </View>
          </View>

          {/* Allergens */}
          {dish.allergens.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contains</Text>
              <View style={styles.allergenRow}>
                {dish.allergens.map((a) => (
                  <View key={a} style={styles.allergenChip}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={11} color={Colors.error} />
                    <Text style={styles.allergenText}>{a.charAt(0).toUpperCase() + a.slice(1)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Auguste pairing */}
          <View style={styles.pairingCard}>
            <View style={styles.pairingHeader}>
              <MaterialCommunityIcons name="glass-wine" size={16} color={Colors.accent} />
              <Text style={styles.pairingTitle}>Auguste's Pairing</Text>
            </View>
            <Text style={styles.pairingNote}>{dish.pairingNote}</Text>
          </View>
        </ScrollView>

        {/* CTA footer */}
        <View style={styles.footer}>
          {inCartQty > 0 && (
            <Text style={styles.inCartNote}>
              {inCartQty} already in your cart
            </Text>
          )}
          <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.85}>
            <MaterialCommunityIcons name="cart-plus" size={18} color={Colors.textDark} />
            <Text style={styles.addButtonText}>
              {inCartQty > 0 ? 'Add Another' : 'Add to Cart'} · ${dish.price.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  hero: {
    height: 220,
    width: '100%',
    justifyContent: 'space-between',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroFallback: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroEmojiFallback: {
    fontSize: 72,
  },
  closeBtn: {
    position: 'absolute',
    right: Spacing.md,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heroBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    backgroundColor: 'rgba(232,160,32,0.18)',
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  body: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  dishName: {
    color: Colors.textMain,
    fontSize: FontSize.xl,
    fontWeight: '800',
    flex: 1,
    lineHeight: 28,
  },
  dishPrice: {
    color: Colors.accent,
    fontSize: FontSize.xl,
    fontWeight: '800',
    flexShrink: 0,
  },
  dietaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dietaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dietaryLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  description: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    lineHeight: 23,
  },
  quickInfo: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickChipText: {
    color: Colors.textMain,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statPill: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  statValue: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  allergenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  allergenText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  pairingCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  pairingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pairingTitle: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  pairingNote: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
  },
  inCartNote: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    color: Colors.textDark,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
});
