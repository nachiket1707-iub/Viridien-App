import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  ImageBackground,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';
import { Colors, Radius, FontSize, Spacing } from '../config/theme';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  emoji?: string;
  description: string;
  dietary: string[];
  category: string;
  calories?: number;
  prepTime?: string;
  allergens?: string[];
  nutrition?: { protein: number; carbs: number; fat: number };
  pairingNote?: string;
}

interface Props {
  item: MenuItem;
  onPress: (item: MenuItem) => void;
}

const DIETARY_DOT: Record<string, string> = {
  vegetarian: '#22c55e',
  vegan: '#06b6d4',
  'gluten-free': '#a78bfa',
  'chefs-special': Colors.accent,
};

export default function MenuCard({ item, onPress }: Props) {
  const addToCart = useStore((s) => s.addToCart);
  const cartItems = useStore((s) => s.cartItems);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const inCart = cartItems.find((c) => c.id === item.id);
  const qty = inCart?.quantity ?? 0;

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addToCart({ id: item.id, name: item.name, price: item.price, quantity: 1, category: item.category });
    setAdded(true);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start(() => setTimeout(() => setAdded(false), 1400));
  };

  const showImage = item.imageUrl && !imgError;

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      {/* Tappable image area */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => { Haptics.selectionAsync(); onPress(item); }}
        style={styles.imageTouch}
      >
        {showImage ? (
          <ImageBackground
            source={{ uri: item.imageUrl }}
            style={styles.image}
            imageStyle={styles.imageFill}
            onError={() => setImgError(true)}
          >
            <LinearGradient
              colors={['transparent', 'rgba(9,9,15,0.82)']}
              style={styles.imageGradient}
            />
            {/* Dietary dots top-left */}
            {item.dietary.length > 0 && (
              <View style={styles.dotsRow}>
                {item.dietary.map((tag) => {
                  const color = DIETARY_DOT[tag];
                  if (!color) return null;
                  return <View key={tag} style={[styles.dot, { backgroundColor: color }]} />;
                })}
              </View>
            )}
            {/* Cart qty badge */}
            {qty > 0 && (
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyBadgeText}>{qty}</Text>
              </View>
            )}
          </ImageBackground>
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackEmoji}>{item.emoji ?? '🍽️'}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Info row */}
      <TouchableOpacity
        style={styles.info}
        activeOpacity={0.88}
        onPress={() => { Haptics.selectionAsync(); onPress(item); }}
      >
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        </View>
        {item.calories != null && (
          <Text style={styles.meta}>
            {item.calories > 0 ? `${item.calories} kcal` : 'No calories'}{item.prepTime ? ` · ${item.prepTime}` : ''}
          </Text>
        )}
      </TouchableOpacity>

      {/* Add button */}
      <TouchableOpacity
        style={[styles.addButton, added && styles.addedButton]}
        onPress={handleAdd}
        activeOpacity={0.82}
      >
        <MaterialCommunityIcons
          name={added ? 'check' : 'plus'}
          size={16}
          color={Colors.textDark}
        />
        <Text style={styles.addButtonText}>{added ? 'Added' : qty > 0 ? `Add More` : 'Add to Cart'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageTouch: {
    width: '100%',
  },
  image: {
    height: 120,
    width: '100%',
    justifyContent: 'space-between',
  },
  imageFill: {
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  imageFallback: {
    height: 120,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFallbackEmoji: {
    fontSize: 42,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    padding: Spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    opacity: 0.9,
  },
  qtyBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  qtyBadgeText: {
    color: Colors.textDark,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  info: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: 4,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    color: Colors.textMain,
    fontSize: FontSize.sm,
    fontWeight: '700',
    flex: 1,
  },
  price: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '800',
    flexShrink: 0,
  },
  meta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  addButton: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 5,
    marginTop: 6,
  },
  addedButton: {
    backgroundColor: Colors.success,
  },
  addButtonText: {
    color: Colors.textDark,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
