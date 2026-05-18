import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { useStore, CartItem } from '../store/useStore';
import { Colors, FontSize, Spacing, Radius } from '../config/theme';
import { RootTabParamList } from '../navigation/AppNavigator';

type Nav = BottomTabNavigationProp<RootTabParamList>;

const TAX_RATE = 0.08;

function CartItemRow({ item }: { item: CartItem }) {
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const countAnim = useRef(new Animated.Value(1)).current;

  const bump = () =>
    Animated.sequence([
      Animated.spring(countAnim, { toValue: 1.4, useNativeDriver: true, speed: 60 }),
      Animated.spring(countAnim, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start();

  const handleIncrease = () => {
    Haptics.selectionAsync();
    bump();
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrease = () => {
    Haptics.selectionAsync();
    if (item.quantity === 1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      removeFromCart(item.id);
    } else {
      bump();
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  return (
    <View style={styles.cartRow}>
      <View style={styles.cartRowLeft}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category.charAt(0)}</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)} each</Text>
        </View>
      </View>

      <View style={styles.qtyControls}>
        <TouchableOpacity style={styles.qtyButton} onPress={handleDecrease} activeOpacity={0.7}>
          <MaterialCommunityIcons
            name={item.quantity === 1 ? 'trash-can-outline' : 'minus'}
            size={16}
            color={item.quantity === 1 ? Colors.error : Colors.textMain}
          />
        </TouchableOpacity>
        <Animated.Text style={[styles.qtyCount, { transform: [{ scale: countAnim }] }]}>
          {item.quantity}
        </Animated.Text>
        <TouchableOpacity style={styles.qtyButton} onPress={handleIncrease} activeOpacity={0.7}>
          <MaterialCommunityIcons name="plus" size={16} color={Colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.itemLineTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
      </View>
    </View>
  );
}

function SuccessModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSubtitle}>
            Your order is on its way! Our chef is already excited to prepare your meal.{'\n\n'}
            Estimated time: <Text style={{ color: Colors.accent, fontWeight: '700' }}>25–35 minutes</Text>
          </Text>
          <TouchableOpacity style={styles.successButton} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.successButtonText}>Continue Dining</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const cartItems = useStore((s) => s.cartItems);
  const clearCart = useStore((s) => s.clearCart);
  const cartTotal = useStore((s) => s.cartTotal());

  const [showSuccess, setShowSuccess] = useState(false);

  const subtotal = cartTotal;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handlePlaceOrder = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    clearCart();
    navigation.navigate('Menu');
  };

  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={[Colors.primary, Colors.surface]} style={styles.header}>
          <Text style={styles.headerTitle}>Your Cart</Text>
        </LinearGradient>
        <View style={styles.emptyState}>
          <Text style={styles.emptyArt}>{'  🍽️\n _____\n|     |\n|     |\n|_____|'}</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse the menu or ask Auguste, our AI concierge, for personalized recommendations.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Menu')}
            activeOpacity={0.85}
          >
            <Text style={styles.browseButtonText}>Browse Menu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => navigation.navigate('Chat')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="robot-outline" size={16} color={Colors.accent} />
            <Text style={styles.chatButtonText}>Ask Auguste</Text>
          </TouchableOpacity>
        </View>
        <SuccessModal visible={showSuccess} onClose={handleSuccessClose} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.primary, Colors.surface]} style={styles.header}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <Text style={styles.headerSubtitle}>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</Text>
      </LinearGradient>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 180 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <CartItemRow item={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Order Summary Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Est. Tax (8%)</Text>
          <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.orderButton} onPress={handlePlaceOrder} activeOpacity={0.88}>
          <LinearGradient
            colors={['#e8c96d', Colors.accent, '#a67c32']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.orderButtonGradient}
          >
            <MaterialCommunityIcons name="food" size={20} color={Colors.primary} />
            <Text style={styles.orderButtonText}>Place Order · ${total.toFixed(2)}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueBrowsing}
          onPress={() => navigation.navigate('Menu')}
        >
          <Text style={styles.continueBrowsingText}>Continue Browsing</Text>
        </TouchableOpacity>
      </View>

      <SuccessModal visible={showSuccess} onClose={handleSuccessClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    color: Colors.accent,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  listContent: {
    padding: Spacing.md,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  cartRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  categoryBadgeText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: Colors.textMain,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  itemPrice: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qtyCount: {
    color: Colors.textMain,
    fontSize: FontSize.md,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  itemLineTotal: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '700',
    minWidth: 52,
    textAlign: 'right',
  },
  separator: {
    height: Spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  summaryValue: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 4,
    paddingTop: 8,
  },
  totalLabel: {
    color: Colors.textMain,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  totalValue: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  orderButton: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  orderButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  orderButtonText: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  continueBrowsing: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  continueBrowsingText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyArt: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
    fontFamily: 'monospace',
    textAlign: 'center',
    opacity: 0.5,
    marginBottom: 8,
  },
  emptyTitle: {
    color: Colors.textMain,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
  },
  browseButtonText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  chatButtonText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    maxWidth: 360,
    gap: Spacing.md,
  },
  successEmoji: {
    fontSize: 56,
  },
  successTitle: {
    color: Colors.textMain,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  successSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  successButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
});
