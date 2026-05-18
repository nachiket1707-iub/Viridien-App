import { create } from 'zustand';
import { ENDPOINTS } from '../config/api';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  timestamp: Date;
  actions?: CartAction[];
}

export interface CartAction {
  type: 'ADD_ITEM' | 'REMOVE_ITEM' | 'UPDATE_QUANTITY' | 'CLEAR_CART' | 'NO_ACTION';
  item?: Partial<CartItem>;
}

interface BistroStore {
  cartItems: CartItem[];
  messages: Message[];
  isTyping: boolean;
  lastCartToast: string | null;

  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  addMessage: (message: Message) => void;
  setIsTyping: (val: boolean) => void;
  setLastCartToast: (msg: string | null) => void;
  sendMessage: (text: string) => Promise<void>;

  cartTotal: () => number;
  cartCount: () => number;
}

export const useStore = create<BistroStore>((set, get) => ({
  cartItems: [],
  messages: [],
  isTyping: false,
  lastCartToast: null,

  addToCart: (item) =>
    set((state) => {
      const existing = state.cartItems.find((c) => c.id === item.id);
      if (existing) {
        return {
          cartItems: state.cartItems.map((c) =>
            c.id === item.id ? { ...c, quantity: c.quantity + (item.quantity || 1) } : c,
          ),
        };
      }
      return { cartItems: [...state.cartItems, { ...item, quantity: item.quantity || 1 }] };
    }),

  removeFromCart: (id) =>
    set((state) => ({ cartItems: state.cartItems.filter((c) => c.id !== id) })),

  updateQuantity: (id, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { cartItems: state.cartItems.filter((c) => c.id !== id) };
      }
      return {
        cartItems: state.cartItems.map((c) => (c.id === id ? { ...c, quantity } : c)),
      };
    }),

  clearCart: () => set({ cartItems: [] }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setIsTyping: (val) => set({ isTyping: val }),

  setLastCartToast: (msg) => set({ lastCartToast: msg }),

  cartTotal: () =>
    get().cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),

  cartCount: () =>
    get().cartItems.reduce((sum, item) => sum + item.quantity, 0),

  sendMessage: async (text: string) => {
    const { cartItems, addMessage, setIsTyping, addToCart, removeFromCart, updateQuantity, clearCart, setLastCartToast } = get();

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    setIsTyping(true);

    try {
      const response = await fetch(ENDPOINTS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, cartItems }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // Process actions
      const toastItems: string[] = [];
      if (Array.isArray(data.actions)) {
        for (const action of data.actions as CartAction[]) {
          if (!action || !action.type || action.type === 'NO_ACTION') continue;

          if (action.type === 'ADD_ITEM' && action.item?.id) {
            addToCart({
              id: action.item.id,
              name: action.item.name || 'Item',
              price: action.item.price || 0,
              quantity: action.item.quantity || 1,
              category: action.item.category || '',
            });
            toastItems.push(`Added ${action.item.name}`);
          } else if (action.type === 'REMOVE_ITEM' && action.item?.id) {
            removeFromCart(action.item.id);
            toastItems.push(`Removed ${action.item.name}`);
          } else if (action.type === 'UPDATE_QUANTITY' && action.item?.id) {
            updateQuantity(action.item.id, action.item.quantity || 1);
          } else if (action.type === 'CLEAR_CART') {
            clearCart();
            toastItems.push('Cart cleared');
          }
        }
      }

      if (toastItems.length > 0) {
        setLastCartToast(toastItems.join(' • '));
        setTimeout(() => setLastCartToast(null), 3000);
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.message || 'How can I help you?',
        suggestions: data.suggestions || [],
        actions: data.actions || [],
        timestamp: new Date(),
      };
      addMessage(assistantMessage);
    } catch (err) {
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please check that the backend server is running and try again.",
        suggestions: ['Try again', 'View the menu', 'Clear and restart'],
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  },
}));
