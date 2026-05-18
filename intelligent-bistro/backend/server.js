require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nlp = require('./nlp');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const IMG = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=75`;

const MENU_DATA = {
  categories: [
    {
      id: 'starters',
      name: 'Starters',
      items: [
        {
          id: 'starter-jalapeno-poppers',
          name: 'Jalapeño Poppers',
          price: 12,
          imageUrl: 'https://www.allrecipes.com/thmb/N0vQPdFN0vqsx55MjyX9nFZAKW8=/0x512/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/20858-best-ever-jalapeno-poppers-DDMFS-4x3-69772a3d60cd4a63b6dfac0ff415db51.jpg',
          emoji: '🌶️',
          description: 'Golden-fried jalapeños stuffed with herbed cream cheese and sharp cheddar, served with a smoky chipotle ranch.',
          dietary: [],
          category: 'STARTERS',
          calories: 360,
          prepTime: '12 min',
          allergens: ['gluten', 'dairy', 'eggs'],
          nutrition: { protein: 10, carbs: 30, fat: 22 },
          pairingNote: 'A cold craft beer or iced tea tames the heat perfectly.',
        },
        {
          id: 'starter-calamari',
          name: 'Crispy Calamari',
          price: 13,
          imageUrl: IMG('photo-1599487488170-d11ec9c172f0'),
          emoji: '🦑',
          description: 'Lightly breaded calamari rings with house-made marinara, lemon aioli, and fresh parsley.',
          dietary: [],
          category: 'STARTERS',
          calories: 380,
          prepTime: '10 min',
          allergens: ['gluten', 'shellfish', 'eggs'],
          nutrition: { protein: 18, carbs: 32, fat: 16 },
          pairingNote: 'Classic with a chilled Pinot Grigio or a cold craft lager.',
        },
        {
          id: 'starter-french-onion-soup',
          name: 'French Onion Soup',
          price: 12,
          imageUrl: IMG('photo-1547592166-23ac45744acd'),
          emoji: '🍲',
          description: 'Slowly caramelized onions in a rich beef consommé, topped with a gruyère crouton and gratinéed to perfection.',
          dietary: ['vegetarian'],
          category: 'STARTERS',
          calories: 290,
          prepTime: '15 min',
          allergens: ['gluten', 'dairy'],
          nutrition: { protein: 10, carbs: 28, fat: 12 },
          pairingNote: 'A classic Burgundy or dry Sherry complements the deep caramelized flavors.',
        },
      ],
    },
    {
      id: 'mains',
      name: 'Mains',
      items: [
        {
          id: 'main-salmon',
          name: 'Pan-Seared Salmon',
          price: 32,
          imageUrl: IMG('photo-1519708227418-c8fd9a32b7a2'),
          emoji: '🐟',
          description: 'Atlantic salmon with crispy skin, lemon beurre blanc, capers, and seasonal vegetables.',
          dietary: ['gluten-free', 'chefs-special'],
          category: 'MAINS',
          calories: 520,
          prepTime: '18 min',
          allergens: ['fish', 'dairy'],
          nutrition: { protein: 42, carbs: 12, fat: 28 },
          pairingNote: 'Exceptional with a buttery Chardonnay or light Pinot Noir.',
        },
        {
          id: 'main-wagyu-burger',
          name: 'Wagyu Beef Burger',
          price: 28,
          imageUrl: IMG('photo-1568901346375-23c9450c58cd'),
          emoji: '🍔',
          description: 'A5 Wagyu patty on a brioche bun with aged cheddar, truffle mayo, caramelized onions, and house pickles.',
          dietary: ['chefs-special'],
          category: 'MAINS',
          calories: 890,
          prepTime: '20 min',
          allergens: ['gluten', 'dairy', 'eggs'],
          nutrition: { protein: 52, carbs: 58, fat: 48 },
          pairingNote: 'A bold Cabernet Sauvignon or a hoppy craft IPA are perfect matches.',
        },
        {
          id: 'main-spicy-chicken-sandwich',
          name: 'Spicy Chicken Sandwich',
          price: 18,
          imageUrl: 'https://kitchenswagger.com/wp-content/uploads/2021/11/spicy-chicken-sandwich-4.jpg',
          emoji: '🌶️',
          description: 'Crispy fried chicken thigh with house sriracha mayo, pickled jalapeños, cabbage slaw, and dill pickles on a toasted brioche bun.',
          dietary: ['chefs-special'],
          category: 'MAINS',
          calories: 680,
          prepTime: '18 min',
          allergens: ['gluten', 'dairy', 'eggs'],
          nutrition: { protein: 38, carbs: 54, fat: 30 },
          pairingNote: 'A cold craft beer or our fresh lemonade cuts right through the heat.',
        },
        {
          id: 'main-mushroom-risotto',
          name: 'Wild Mushroom Risotto',
          price: 24,
          imageUrl: IMG('photo-1476124369491-e7addf5db371'),
          emoji: '🍄',
          description: 'Carnaroli rice with a medley of wild mushrooms, white wine, parmesan, and black truffle shavings.',
          dietary: ['vegetarian', 'gluten-free'],
          category: 'MAINS',
          calories: 610,
          prepTime: '25 min',
          allergens: ['dairy'],
          nutrition: { protein: 16, carbs: 78, fat: 22 },
          pairingNote: 'Earthy and rich — try with an aged Barolo or Pinot Noir.',
        },
        {
          id: 'main-arrabbiata',
          name: 'Pasta Arrabbiata',
          price: 16,
          imageUrl: IMG('photo-1563379926898-05f4575a45d8'),
          emoji: '🍝',
          description: 'Al dente rigatoni in a fiery San Marzano tomato and chilli sauce, finished with fresh basil and aged pecorino.',
          dietary: ['vegetarian', 'vegan'],
          category: 'MAINS',
          calories: 380,
          prepTime: '15 min',
          allergens: ['gluten'],
          nutrition: { protein: 12, carbs: 62, fat: 8 },
          pairingNote: 'A bold Chianti or Montepulciano d\'Abruzzo stands up perfectly to the heat.',
        },
        {
          id: 'main-spaghetti-mushrooms',
          name: 'Spaghetti with Mushrooms',
          price: 12,
          imageUrl: IMG('photo-1595295333158-4742f28fbd85'),
          emoji: '🍝',
          description: 'Al dente spaghetti tossed with a medley of wild mushrooms, garlic, white wine, parmesan, and fresh herbs.',
          dietary: ['vegetarian'],
          category: 'MAINS',
          calories: 420,
          prepTime: '18 min',
          allergens: ['gluten', 'dairy'],
          nutrition: { protein: 14, carbs: 68, fat: 14 },
          pairingNote: 'A light Pinot Grigio or earthy Pinot Noir brings out the umami of the mushrooms.',
        },
      ],
    },
    {
      id: 'sides',
      name: 'Sides',
      items: [
        {
          id: 'side-truffle-fries',
          name: 'Truffle Fries',
          price: 10,
          imageUrl: IMG('photo-1573080496219-bb080dd4f877'),
          emoji: '🍟',
          description: 'Hand-cut fries tossed in white truffle oil, parmesan, and fresh chives.',
          dietary: ['vegetarian', 'vegan'],
          category: 'SIDES',
          calories: 380,
          prepTime: '12 min',
          allergens: ['dairy'],
          nutrition: { protein: 6, carbs: 52, fat: 16 },
          pairingNote: 'The ultimate indulgent side for any main.',
        },
        {
          id: 'side-salad',
          name: 'Side Salad',
          price: 7,
          imageUrl: IMG('photo-1512621776951-a57141f2eefd'),
          emoji: '🥗',
          description: 'Seasonal greens with shaved vegetables, house vinaigrette, and candied walnuts.',
          dietary: ['vegetarian', 'vegan', 'gluten-free'],
          category: 'SIDES',
          calories: 140,
          prepTime: '5 min',
          allergens: ['tree nuts'],
          nutrition: { protein: 3, carbs: 12, fat: 8 },
          pairingNote: 'A fresh counterpoint to any rich main.',
        },
      ],
    },
    {
      id: 'desserts',
      name: 'Desserts',
      items: [
        {
          id: 'dessert-chocolate-cupcakes',
          name: 'Chocolate Cupcakes',
          price: 9,
          imageUrl: IMG('photo-1550617931-e17a7b70dce2'),
          emoji: '🧁',
          description: 'Moist dark chocolate cupcakes with Valrhona ganache frosting, a dusting of cocoa, and a hidden salted caramel centre.',
          dietary: ['vegetarian'],
          category: 'DESSERTS',
          calories: 380,
          prepTime: '5 min',
          allergens: ['gluten', 'dairy', 'eggs'],
          nutrition: { protein: 5, carbs: 48, fat: 18 },
          pairingNote: 'A glass of ruby Port or a scoop of vanilla ice cream alongside is perfection.',
        },
        {
          id: 'dessert-lava-cake',
          name: 'Chocolate Lava Cake',
          price: 12,
          imageUrl: IMG('photo-1563805042-7684c019e1cb'),
          emoji: '🍫',
          description: 'Warm Valrhona chocolate cake with a molten center, vanilla bean ice cream, and cocoa dust.',
          dietary: ['vegetarian', 'chefs-special'],
          category: 'DESSERTS',
          calories: 580,
          prepTime: '12 min',
          allergens: ['gluten', 'dairy', 'eggs'],
          nutrition: { protein: 8, carbs: 64, fat: 32 },
          pairingNote: 'A ruby Port or sweet Muscat will make this divine.',
        },
        {
          id: 'dessert-tiramisu',
          name: 'Tiramisu',
          price: 10,
          imageUrl: IMG('photo-1571877227200-a0d98ea607e9'),
          emoji: '🍰',
          description: 'Housemade with Savoiardi biscuits, mascarpone cream, espresso, and a generous dusting of premium cocoa.',
          dietary: ['vegetarian'],
          category: 'DESSERTS',
          calories: 420,
          prepTime: '5 min',
          allergens: ['gluten', 'dairy', 'eggs'],
          nutrition: { protein: 8, carbs: 44, fat: 22 },
          pairingNote: 'A shot of espresso or an Amaretto on the side is classic.',
        },
      ],
    },
    {
      id: 'drinks',
      name: 'Drinks',
      items: [
{ id: 'drink-still-water', name: 'Still Water', price: 3, imageUrl: IMG('photo-1548839140-29a749e1cf4d'), emoji: '💧', description: 'Premium still mineral water.', dietary: ['vegan', 'gluten-free'], category: 'DRINKS', calories: 0, prepTime: '1 min', allergens: [], nutrition: { protein: 0, carbs: 0, fat: 0 }, pairingNote: 'Hydration is the foundation of a great meal.' },
        { id: 'drink-lemonade', name: 'Fresh Lemonade', price: 6, imageUrl: IMG('photo-1621263764928-df1444c5e859'), emoji: '🍋', description: 'Freshly squeezed lemonade with mint and a touch of honey.', dietary: ['vegan', 'gluten-free'], category: 'DRINKS', calories: 120, prepTime: '3 min', allergens: [], nutrition: { protein: 0, carbs: 30, fat: 0 }, pairingNote: 'Bright and citrusy — great with starters and salads.' },
        { id: 'drink-iced-tea', name: 'Iced Tea', price: 5, imageUrl: IMG('photo-1556679343-c7306c1976bc'), emoji: '🍵', description: 'House-brewed iced tea with fresh citrus.', dietary: ['vegan', 'gluten-free'], category: 'DRINKS', calories: 80, prepTime: '3 min', allergens: [], nutrition: { protein: 0, carbs: 20, fat: 0 }, pairingNote: 'Refreshing alongside lighter dishes.' },
        { id: 'drink-house-wine', name: 'House Wine', price: 12, imageUrl: IMG('photo-1510812431401-41d2bd2722f3'), emoji: '🍷', description: 'Curated selection of red or white — ask Auguste for a pairing recommendation.', dietary: ['vegan', 'gluten-free'], category: 'DRINKS', calories: 125, prepTime: '2 min', allergens: ['sulfites'], nutrition: { protein: 0, carbs: 4, fat: 0 }, pairingNote: "Ask Auguste — he'll find the perfect match for your meal." },
        { id: 'drink-craft-beer', name: 'Craft Beer', price: 8, imageUrl: IMG('photo-1608270586620-248524c67de9'), emoji: '🍺', description: 'Rotating selection of local craft beers on draught.', dietary: ['vegan'], category: 'DRINKS', calories: 180, prepTime: '2 min', allergens: ['gluten'], nutrition: { protein: 2, carbs: 14, fat: 0 }, pairingNote: "Ask your server what's on tap — rotates weekly." },
      ],
    },
  ],
};

const ALL_ITEMS = MENU_DATA.categories.flatMap((c) => c.items);

app.post('/api/chat', (req, res) => {
  try {
    const { message, cartItems = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required and must be a string' });
    }

    const result = nlp.processMessage(message, cartItems, ALL_ITEMS);
    return res.json(result);
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

app.get('/api/menu', (req, res) => {
  res.json(MENU_DATA);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🍽️  The Intelligent Bistro API running on http://localhost:${PORT}`);
});
