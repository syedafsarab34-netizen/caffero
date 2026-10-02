const limit = (value, low, high) => Math.min(high, Math.max(low, Number(value) || low));

export function ratioWater(coffeeGrams, ratio) {
  return Math.round(limit(coffeeGrams, 1, 500) * limit(ratio, 1, 80));
}

export function makeRecipe(method, cups = 2, strength = 1) {
  const servings = Math.round(limit(cups, 1, 8));
  const strengthFactor = limit(strength, 0.85, 1.2);
  const presets = {
    "french-press": { grams: 15, ratio: 15, liquid: "Brew water", note: "A dependable start. Fine-tune the grind or strength to your taste." },
    "moka-pot": { grams: 9, ratio: 10, liquid: "Brew water", note: "Fill the moka basket loosely. Never press the coffee down." },
    aeropress: { grams: 15, ratio: 15, liquid: "Brew water", note: "A quick, forgiving cup. Press gently and stop when you hear air." },
    "espresso": { grams: 9, ratio: 2, liquid: "Shot yield", note: "Weigh your output. A 1:2 dose-to-yield is a friendly place to begin." },
    "pour-over": { grams: 12.5, ratio: 16, liquid: "Brew water", note: "A gentle pour and medium grind are an easy place to start." },
    "cold-brew": { grams: 25, ratio: 8, liquid: "Brew water", note: "This makes a concentrate. Pour it over an equal amount of water or milk." }
  };
  const preset = presets[method.slug] || presets["french-press"];
  const coffee = Math.max(1, Math.round(preset.grams * servings * strengthFactor * 2) / 2);
  const details = method.data || {};
  return {
    coffee: coffee,
    liquid: ratioWater(coffee, preset.ratio),
    unit: preset.liquid,
    temperature: details.temperature || "Just off the boil",
    grind: details.grind || "Medium",
    time: details.time || "3–4 min",
    ratio: "1:" + preset.ratio,
    servings: servings,
    note: preset.note,
    method: method.title
  };
}

export function formatGrams(grams) {
  return Number.isInteger(grams) ? String(grams) : Number(grams).toFixed(1);
}
