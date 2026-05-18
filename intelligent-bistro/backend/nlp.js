'use strict';

// ─── Quantity words ────────────────────────────────────────────────────────────
const QTY_WORDS = {
  zero: 0, a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, couple: 2, few: 2, pair: 2,
};

// Size/modifier words stripped before quantity scanning so "a large water" → qty 1 (via "a"), not misread
const SIZE_RE = /\b(large|small|medium|big|regular|xl|sm|grande|mini|extra)\b/gi;

// ─── Item ID → searchable aliases (longest first per group for greedy match) ──
const ALIASES = {
  'starter-jalapeno-poppers':      ['jalapeño poppers', 'jalapeno poppers', 'jalapeño popper', 'jalapeno popper', 'poppers', 'popper'],
  'main-arrabbiata':               ['pasta arrabbiata', 'arrabbiata pasta', 'arrabbiata', 'arrabiata', 'spicy pasta'],
  'starter-calamari':              ['crispy calamari', 'calamari rings', 'calamari', 'squid'],
  'starter-french-onion-soup':     ['french onion soup', 'onion soup', 'french onion'],
  'main-salmon':                   ['pan-seared salmon', 'pan seared salmon', 'seared salmon', 'salmon'],
  'main-wagyu-burger':             ['wagyu beef burger', 'wagyu burger', 'wagyu', 'burger'],
  'main-spicy-chicken-sandwich':   ['spicy chicken sandwich', 'crispy chicken sandwich', 'fried chicken sandwich', 'chicken sandwich', 'spicy chicken', 'chicken'],
  'main-mushroom-risotto':         ['wild mushroom risotto', 'mushroom risotto', 'risotto', 'wild mushroom'],
  'main-spaghetti-mushrooms':      ['spaghetti with mushrooms', 'mushroom spaghetti', 'spaghetti mushroom', 'spaghetti'],
  'side-truffle-fries':            ['truffle fries', 'fries', 'chips'],
  'side-salad':                    ['side salad', 'salad'],
  'dessert-chocolate-cupcakes':    ['chocolate cupcakes', 'chocolate cupcake', 'cupcakes', 'cupcake'],
  'dessert-lava-cake':             ['chocolate lava cake', 'lava cake', 'molten cake', 'chocolate cake'],
  'dessert-tiramisu':              ['tiramisu'],
  'drink-still-water':             ['still water', 'water'],
  'drink-lemonade':                ['fresh lemonade', 'lemonade'],
  'drink-iced-tea':                ['iced tea', 'ice tea', 'tea'],
  'drink-house-wine':              ['glass of wine', 'house wine', 'wine'],
  'drink-craft-beer':              ['craft beer', 'beer', 'lager', 'ale'],
};

// ─── Intent patterns ──────────────────────────────────────────────────────────
const P = {
  ADD:        /\b(add|want|like|have|get|give me|order|bring|i'?l+\s+(take|have|get)|can i (get|have|order)|i'?d like|i need|please (add|get|bring)|i'?l+\s+go\s+(for|with)|i'?m\s+going\s+(for|with)|put in|throw in)\b/i,
  REMOVE:     /\b(remove|take off|take away|delete|cancel|don'?t want|no more|without|drop the|get rid of|scratch that)\b/i,
  CLEAR:      /\b(clear|empty|reset|start over|start fresh|remove all|remove everything|cancel all|wipe|clean (the )?cart)\b/i,
  CART:       /\b(what'?s? in (my )?cart|my (order|cart)|what (have|did) i (ordered?|got)|show (me )?my (cart|order)|my (total|bill|tab)|what am i (having|getting)|how much (is|does) (it|my (order|cart)))\b/i,
  MENU:       /\b(menu|what (do you |can i )(have|see|get|order|have)|what'?s? available|show (me )?(the )?menu|see (the )?menu)\b/i,
  RECOMMEND:  /\b(recommend|suggest|what'?s? (good|popular|best|your (best|favourite|favorite|special|pick))|what should i (get|order|try)|what (would you|do you) recommend|house (special|favourite)|highlight|tonight'?s? (special|pick)|chef'?s? (special|pick|choice|recommendation))\b/i,
  DISH_INFO:  /\b(tell me (about|more)|what'?s? in|contain|made (of|with)|ingredient|describe|more (about|info|details)|how is|what (is|are) the)\b/i,
  VEGETARIAN: /\b(vegetarian|vegan|plant.based|no meat|meat.free|meat free)\b/i,
  GLUTEN:     /\b(gluten.?free|gluten free|no gluten|coeliac|celiac)\b/i,
  ALLERGEN:   /\b(allergen|allerg(ic|y)|intolerant|intolerance|contains?)\b/i,
  CALORIES:   /\b(calor(ie|ies|ic)|kcal|healthy|how (many|fattening)|nutrition(al)?|macros?)\b/i,
  GREETING:   /^(hi+\b|hello+\b|hey+\b|good (morning|afternoon|evening|night)|howdy|greetings|bonjour|bonsoir)/i,
  THANKS:     /\b(thank(s| you)|thx|cheers|perfect|great|awesome|brilliant|wonderful|that'?s? (great|perfect|lovely|amazing))\b/i,
  DONE:       /\b(that'?s? (all|it|everything)|nothing else|all (good|set)|i'?m (done|finished|good|set|all set)|place (my )?order|check(ing)? out|that('?ll| will) (be|do) (it|all))\b/i,
  STARTERS:   /\b(starter|starters|appetizer|appetizers|to start|start with)\b/i,
  MAINS:      /\b(main|mains|main course|entree|entrees|for (my )?main)\b/i,
  SIDES:      /\b(side|sides|side dish)\b/i,
  DESSERTS:   /\b(dessert|desserts|sweet|sweets|pudding|after)\b/i,
  DRINKS:     /\b(drink|drinks|beverage|beverages|something to drink|to drink|liquid)\b/i,
  PAIRING:    /\b(pair(s|ing)?|go(es)? with|match|complement|drink with)\b/i,
};

// Verb-level patterns used by resolveIntent for per-item ADD vs REMOVE determination
const ADD_VERB_SOURCE    = '\\b(add|want|like|have|get|give me|order|bring|take|go with|put in|throw in)\\b';
const REMOVE_VERB_SOURCE = '\\b(remove|take off|take away|delete|cancel|scratch|drop|without|no more|get rid of)\\b';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatList(names) {
  if (names.length === 0) return 'nothing';
  if (names.length === 1) return names[0];
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}

function extractQty(text) {
  // Strip size modifiers so "a large water" → "a water" → qty 1 via "a", not "large"
  const cleaned = text.replace(SIZE_RE, '');
  const digit = cleaned.match(/\b(\d+)\b/);
  if (digit) return Math.min(parseInt(digit[1], 10), 20);
  const lower = cleaned.toLowerCase();
  // Check words with qty > 1 first — prevents generic "a" from beating "two" when both appear
  for (const [word, n] of Object.entries(QTY_WORDS)) {
    if (n > 1 && new RegExp(`\\b${word}\\b`).test(lower)) return n;
  }
  return /\b(a|an|one)\b/.test(lower) ? 1 : 1;
}

// Find all menu items mentioned in a message, returning { item, qty, idx } sorted by position
function findMentioned(text, allItems) {
  const lower = text.toLowerCase();
  const results = [];
  const seenIds = new Set();

  // Flatten aliases and sort by length descending for greedy (longest-first) matching
  const candidates = [];
  for (const [id, aliases] of Object.entries(ALIASES)) {
    for (const alias of aliases) {
      candidates.push({ id, alias: alias.toLowerCase() });
    }
  }
  candidates.sort((a, b) => b.alias.length - a.alias.length);

  const usedRanges = [];

  for (const { id, alias } of candidates) {
    if (seenIds.has(id)) continue;
    const idx = lower.indexOf(alias);
    if (idx === -1) continue;
    const end = idx + alias.length;
    if (usedRanges.some(([s, e]) => idx < e && end > s)) continue;

    const item = allItems.find(i => i.id === id);
    if (!item) continue;

    // Look for a quantity in the 30 chars before + 10 chars after the alias
    // Quantity always precedes the item name — only scan before the match
    const before = lower.substring(Math.max(0, idx - 30), idx);
    const qty = extractQty(before);

    results.push({ item, qty, idx });
    seenIds.add(id);
    usedRanges.push([idx, end]);
  }

  // Sort by text position so mixed ADD/REMOVE resolution is left-to-right
  results.sort((a, b) => a.idx - b.idx);
  return results;
}

// For mixed-intent messages ("add X and remove Y"), determine whether the item
// at `itemIdx` is being added or removed by finding the most recent verb before it
function resolveIntent(text, itemIdx) {
  const window = text.substring(Math.max(0, itemIdx - 60), itemIdx);
  let lastAdd = -1;
  let lastRemove = -1;
  let m;
  const addRe = new RegExp(ADD_VERB_SOURCE, 'gi');
  while ((m = addRe.exec(window)) !== null) lastAdd = m.index;
  const removeRe = new RegExp(REMOVE_VERB_SOURCE, 'gi');
  while ((m = removeRe.exec(window)) !== null) lastRemove = m.index;
  if (lastRemove === -1) return 'ADD';
  if (lastAdd === -1) return 'REMOVE';
  return lastAdd > lastRemove ? 'ADD' : 'REMOVE';
}

// ─── Text helpers ─────────────────────────────────────────────────────────────
function cartSummaryText(cartItems) {
  if (!cartItems || cartItems.length === 0) {
    return "Your cart is empty — let me help you fill it! What are you in the mood for?";
  }
  const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const lines = cartItems.map(i => `  • ${i.quantity}× ${i.name} — $${(i.price * i.quantity).toFixed(2)}`).join('\n');
  return `Here's your current order:\n${lines}\n\nSubtotal: $${total.toFixed(2)} (before tax)`;
}

function categoryText(allItems, cat) {
  const items = allItems.filter(i => i.category === cat);
  if (items.length === 0) return `We don't have any ${cat.toLowerCase()} available right now.`;
  const lines = items.map(i => `  • ${i.name} — $${i.price.toFixed(2)}  (${i.calories > 0 ? i.calories + ' kcal' : '0 cal'})`).join('\n');
  return `Our ${cat.charAt(0) + cat.slice(1).toLowerCase()}:\n${lines}`;
}

function fullMenuText(allItems) {
  const cats = ['STARTERS', 'MAINS', 'SIDES', 'DESSERTS', 'DRINKS'];
  return cats.map(cat => categoryText(allItems, cat)).join('\n\n');
}

function vegText(allItems, type) {
  const tag = type === 'vegan' ? 'vegan' : 'vegetarian';
  const items = allItems.filter(i => i.dietary && i.dietary.includes(tag));
  if (items.length === 0) return `I'm sorry, we don't currently have any ${type} options.`;
  const lines = items.map(i => `  • ${i.name} — $${i.price.toFixed(2)}`).join('\n');
  return `Our ${type} options:\n${lines}\n\nWould you like to add any of these?`;
}

function gfText(allItems) {
  const items = allItems.filter(i => i.dietary && i.dietary.includes('gluten-free'));
  const lines = items.map(i => `  • ${i.name} — $${i.price.toFixed(2)}`).join('\n');
  return `Our gluten-free options:\n${lines}\n\nShall I add any of these for you?`;
}

function recommendText(allItems) {
  const specials = allItems.filter(i => i.dietary && i.dietary.includes('chefs-special'));
  const lines = specials
    .map(i => `  • ${i.name} ($${i.price.toFixed(2)}) — ${i.description.split('.')[0]}.`)
    .join('\n');
  return `Tonight's chef's highlights:\n${lines}\n\nShall I add any of these to your cart?`;
}

// ─── Suggestion helpers ───────────────────────────────────────────────────────
const DEFAULT_SUGGESTIONS = ["Show me the menu", "What do you recommend?", "What's in my cart?"];

function addSuggestions(cartItems) {
  return [
    cartItems.length > 0 ? "What's in my cart?" : "Show me starters",
    "Add something else",
    "What do you recommend?",
  ];
}

// ─── Core processMessage ──────────────────────────────────────────────────────
function processMessage(message, cartItems = [], allItems = []) {
  const lower = message.trim().toLowerCase();
  const mentioned = findMentioned(lower, allItems);

  // ── CLEAR CART ──────────────────────────────────────────────────────────────
  if (P.CLEAR.test(lower)) {
    if (!cartItems.length) {
      return {
        message: "Your cart is already empty! What can I get you?",
        actions: [{ type: 'NO_ACTION', item: {} }],
        suggestions: ["Show me the menu", "What do you recommend?", "See starters"],
      };
    }
    return {
      message: "Done! I've cleared your cart. Ready to start fresh?",
      actions: [{ type: 'CLEAR_CART', item: {} }],
      suggestions: ["Show me the menu", "See starters", "What do you recommend?"],
    };
  }

  // ── CART VIEW ───────────────────────────────────────────────────────────────
  if (P.CART.test(lower)) {
    return {
      message: cartSummaryText(cartItems),
      actions: [{ type: 'NO_ACTION', item: {} }],
      suggestions: ["Add more items", "Place my order", "Clear my cart"],
    };
  }

  // ── GREETING ────────────────────────────────────────────────────────────────
  if (P.GREETING.test(lower) && mentioned.length === 0) {
    return {
      message: pick([
        "Bonsoir! Welcome to The Intelligent Bistro. I'm Auguste, your personal culinary concierge. What can I get for you tonight?",
        "Good evening! I'm Auguste. I can help you browse our menu, answer questions about any dish, or take your order. Where shall we begin?",
      ]),
      actions: [{ type: 'NO_ACTION', item: {} }],
      suggestions: ["Show me the menu", "What do you recommend?", "See starters"],
    };
  }

  // ── DONE ────────────────────────────────────────────────────────────────────
  if (P.DONE.test(lower) && mentioned.length === 0) {
    return {
      message: pick([
        "Wonderful! Your selections look excellent. Head to the Cart tab whenever you're ready to confirm your order.",
        "Perfect! Visit the Cart tab to place your order. It's been a pleasure helping you tonight.",
      ]),
      actions: [{ type: 'NO_ACTION', item: {} }],
      suggestions: ["View my cart", "What's my total?", "Add something else"],
    };
  }

  // ── THANKS ──────────────────────────────────────────────────────────────────
  if (P.THANKS.test(lower) && mentioned.length === 0) {
    return {
      message: pick([
        "My pleasure! Is there anything else I can help you with?",
        "Of course! Don't hesitate if you'd like to add anything or have questions about a dish.",
      ]),
      actions: [{ type: 'NO_ACTION', item: {} }],
      suggestions: ["Show me the menu", "What do you recommend?", "View my cart"],
    };
  }

  // ── PAIRING INFO ─────────────────────────────────────────────────────────────
  if (P.PAIRING.test(lower) && mentioned.length > 0) {
    const { item } = mentioned[0];
    return {
      message: item.pairingNote || `The ${item.name} pairs beautifully with our house wine or a craft beer.`,
      actions: [{ type: 'NO_ACTION', item: {} }],
      suggestions: [`Add the ${item.name}`, "Add house wine", "Add craft beer"],
    };
  }

  // ── ALLERGEN INFO ────────────────────────────────────────────────────────────
  if (P.ALLERGEN.test(lower) && mentioned.length > 0) {
    const { item } = mentioned[0];
    const a = item.allergens && item.allergens.length
      ? `Contains: ${item.allergens.join(', ')}.`
      : 'No major allergens listed.';
    return {
      message: `${item.name}: ${a} ${item.description}`,
      actions: [{ type: 'NO_ACTION', item: {} }],
      suggestions: [`Add the ${item.name}`, "See gluten-free options", "Show me the menu"],
    };
  }

  // ── VEGETARIAN / VEGAN ───────────────────────────────────────────────────────
  if (P.VEGETARIAN.test(lower)) {
    const type = /vegan/i.test(lower) ? 'vegan' : 'vegetarian';
    return {
      message: vegText(allItems, type),
      actions: [{ type: 'NO_ACTION', item: {} }],
      suggestions: ["Add the risotto", "Add the arrabbiata", "See the full menu"],
    };
  }

  // ── GLUTEN-FREE ──────────────────────────────────────────────────────────────
  if (P.GLUTEN.test(lower)) {
    return {
      message: gfText(allItems),
      actions: [{ type: 'NO_ACTION', item: {} }],
      suggestions: ["Add the salmon", "Add the sandwich", "Show me mains"],
    };
  }

  // ── CALORIES / NUTRITION ─────────────────────────────────────────────────────
  if (P.CALORIES.test(lower) && mentioned.length > 0) {
    const { item } = mentioned[0];
    const n = item.nutrition || {};
    const msg = item.calories > 0
      ? `The ${item.name} has ${item.calories} kcal per serving — ${n.protein || 0}g protein, ${n.carbs || 0}g carbs, ${n.fat || 0}g fat.`
      : `The ${item.name} has essentially no calories.`;
    return {
      message: msg,
      actions: [{ type: 'NO_ACTION', item: {} }],
      suggestions: [`Add the ${item.name}`, "Show me healthy options", "What's gluten-free?"],
    };
  }

  // ── DISH INFO ────────────────────────────────────────────────────────────────
  if (P.DISH_INFO.test(lower) && mentioned.length > 0) {
    const { item } = mentioned[0];
    const aStr = item.allergens && item.allergens.length ? ` Allergens: ${item.allergens.join(', ')}.` : '';
    return {
      message: `${item.name} ($${item.price.toFixed(2)}, ${item.prepTime}): ${item.description}${aStr}`,
      actions: [{ type: 'NO_ACTION', item: {} }],
      suggestions: [`Add the ${item.name}`, "What does it pair with?", "Show me more dishes"],
    };
  }

  // ── RECOMMENDATIONS ──────────────────────────────────────────────────────────
  if (P.RECOMMEND.test(lower)) {
    return {
      message: recommendText(allItems),
      actions: [{ type: 'NO_ACTION', item: {} }],
      suggestions: ["Add the spicy chicken sandwich", "Add the salmon", "See all mains"],
    };
  }

  // ── CATEGORY VIEWS (only when no ADD intent and no specific item mentioned) ──
  const noAddIntent = !P.ADD.test(lower);
  if (P.STARTERS.test(lower) && noAddIntent && mentioned.length === 0) {
    return { message: categoryText(allItems, 'STARTERS'), actions: [{ type: 'NO_ACTION', item: {} }], suggestions: ["Add jalapeño poppers", "Add the calamari", "See our mains"] };
  }
  if (P.MAINS.test(lower) && noAddIntent && mentioned.length === 0) {
    return { message: categoryText(allItems, 'MAINS'), actions: [{ type: 'NO_ACTION', item: {} }], suggestions: ["Add the spicy chicken sandwich", "Add the salmon", "See sides"] };
  }
  if (P.SIDES.test(lower) && noAddIntent && mentioned.length === 0) {
    return { message: categoryText(allItems, 'SIDES'), actions: [{ type: 'NO_ACTION', item: {} }], suggestions: ["Add truffle fries", "Add a side salad", "See desserts"] };
  }
  if (P.DESSERTS.test(lower) && noAddIntent && mentioned.length === 0) {
    return { message: categoryText(allItems, 'DESSERTS'), actions: [{ type: 'NO_ACTION', item: {} }], suggestions: ["Add the tiramisu", "Add the lava cake", "See drinks"] };
  }
  if (P.DRINKS.test(lower) && noAddIntent && mentioned.length === 0) {
    return { message: categoryText(allItems, 'DRINKS'), actions: [{ type: 'NO_ACTION', item: {} }], suggestions: ["Add house wine", "Add a beer", "See the full menu"] };
  }

  // ── MENU VIEW ────────────────────────────────────────────────────────────────
  if (P.MENU.test(lower) && mentioned.length === 0) {
    return {
      message: `Here's our full menu:\n\n${fullMenuText(allItems)}\n\nJust tell me what you'd like to order!`,
      actions: [{ type: 'NO_ACTION', item: {} }],
      suggestions: ["See starters", "What do you recommend?", "See mains"],
    };
  }

  // ── ADD / REMOVE ITEMS (unified with per-item intent resolution) ──────────────
  if (mentioned.length > 0) {
    const hasAdd    = P.ADD.test(lower);
    const hasRemove = P.REMOVE.test(lower);
    const mixed     = hasAdd && hasRemove;

    const adds    = [];
    const removes = [];

    for (const { item, qty, idx } of mentioned) {
      // In a mixed message resolve per item; otherwise use whichever intent fired
      const intent = mixed
        ? resolveIntent(lower, idx)
        : (hasRemove ? 'REMOVE' : 'ADD');
      if (intent === 'REMOVE') removes.push({ item, qty });
      else                     adds.push({ item, qty });
    }

    const actions = [
      ...removes.map(({ item }) => ({
        type: 'REMOVE_ITEM',
        item: { id: item.id, name: item.name },
      })),
      ...adds.map(({ item, qty }) => ({
        type: 'ADD_ITEM',
        item: { id: item.id, name: item.name, price: item.price, quantity: qty, category: item.category },
      })),
    ];

    let msg;
    if (removes.length > 0 && adds.length > 0) {
      const removedNames = formatList(removes.map(r => r.item.name));
      const addedNames   = formatList(adds.map(({ item, qty }) => qty > 1 ? `${qty}× ${item.name}` : item.name));
      msg = `Done! I've removed ${removedNames} and added ${addedNames} to your cart.`;
    } else if (removes.length > 0) {
      msg = `Done! I've removed ${formatList(removes.map(r => r.item.name))} from your cart. Anything else?`;
    } else if (adds.length === 1) {
      const { item, qty } = adds[0];
      const qtyStr = qty > 1 ? `${qty}× ` : '';
      msg = pick([
        `Perfect choice! I've added ${qtyStr}${item.name} to your cart. Is there anything else I can get for you?`,
        `Excellent! ${qtyStr}${item.name} ${qty > 1 ? 'have' : 'has'} been added to your cart.`,
        `Great taste — ${qtyStr}${item.name} is in your cart. Anything to go with it?`,
      ]);
    } else {
      const nameList = formatList(adds.map(({ item, qty }) => qty > 1 ? `${qty}× ${item.name}` : item.name));
      msg = `Wonderful selections! I've added ${nameList} to your cart.`;
    }

    return {
      message: msg,
      actions,
      suggestions: adds.length > 0
        ? addSuggestions(cartItems)
        : ["What's in my cart?", "Add something else", "Show me the menu"],
    };
  }

  // ── FALLBACK ─────────────────────────────────────────────────────────────────
  return {
    message: pick([
      "I'm not quite sure I understood that. You can ask me to add items, browse the menu by category, or ask about any specific dish.",
      "Could you rephrase that? Try something like 'I'd like the spicy chicken sandwich' or 'show me starters'.",
    ]),
    actions: [{ type: 'NO_ACTION', item: {} }],
    suggestions: DEFAULT_SUGGESTIONS,
  };
}

module.exports = { processMessage };
