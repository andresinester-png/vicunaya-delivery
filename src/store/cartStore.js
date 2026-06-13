import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: '',
      restaurantWhatsapp: '',
      restaurantImage: '',
      fulfillmentMethod: 'delivery', // 'delivery' | 'pickup'

      // Quick-add: increments baseQty by 1, keeps existing extras
      addItem: (item, restaurant) => {
        const { items, restaurantId } = get();

        if (restaurantId && restaurantId !== restaurant.id) {
          if (!window.confirm(`Tu carrito tiene items de "${get().restaurantName}". ¿Querés vaciarlo y agregar de ${restaurant.name}?`)) return;
          set({ items: [], restaurantId: null, fulfillmentMethod: 'delivery' });
        }

        const existing = get().items.find(i => i.id === item.id);
        if (existing) {
          set({ items: get().items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) });
        } else {
          set({
            items: [...get().items, { ...item, qty: 1, extras: 0 }],
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            restaurantWhatsapp: restaurant.whatsapp,
            restaurantImage: restaurant.image_url,
          });
        }
      },

      // Modal set: replaces (or removes) the item's cart entry with exact qty + extras
      setItem: (item, restaurant, qty, extras = 0) => {
        const { restaurantId } = get();

        if (restaurantId && restaurantId !== restaurant.id) {
          if (!window.confirm(`Tu carrito tiene items de "${get().restaurantName}". ¿Querés vaciarlo y pedir de ${restaurant.name}?`)) return;
          set({ items: [], restaurantId: null, fulfillmentMethod: 'delivery' });
        }

        const currentItems = get().items;

        if (qty <= 0 && extras <= 0) {
          const newItems = currentItems.filter(i => i.id !== item.id);
          set({ items: newItems, ...(newItems.length === 0 ? { restaurantId: null, restaurantName: '', restaurantImage: '' } : {}) });
          return;
        }

        const cartItem = { ...item, qty, extras };
        const exists = currentItems.some(i => i.id === item.id);

        if (exists) {
          set({ items: currentItems.map(i => i.id === item.id ? cartItem : i) });
        } else {
          set({
            items: [...currentItems, cartItem],
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            restaurantWhatsapp: restaurant.whatsapp,
            restaurantImage: restaurant.image_url,
          });
        }
      },

      removeItem: (itemId) => {
        const items = get().items.filter(i => i.id !== itemId);
        set({ items, ...(items.length === 0 ? { restaurantId: null, restaurantName: '', restaurantImage: '' } : {}) });
      },

      updateQty: (itemId, qty) => {
        if (qty <= 0) { get().removeItem(itemId); return; }
        set({ items: get().items.map(i => i.id === itemId ? { ...i, qty } : i) });
      },

      setFulfillmentMethod: (method) => set({ fulfillmentMethod: method }),

      clear: () => set({ items: [], restaurantId: null, restaurantName: '', restaurantWhatsapp: '', restaurantImage: '', fulfillmentMethod: 'delivery' }),

      total: () => get().items.reduce(
        (sum, i) => sum + i.price * i.qty + (i.extras || 0) * (i.extra_price || 0),
        0
      ),
      count: () => get().items.reduce((sum, i) => sum + (i.qty || 0) + (i.extras || 0), 0),
    }),
    { name: 'vicunaya-delivery-cart' }
  )
);

export default useCartStore;
