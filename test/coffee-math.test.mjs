import test from "node:test";
import assert from "node:assert/strict";
import { formatGrams, makeRecipe, ratioWater } from "../public/coffee-math.mjs";

test("ratio calculator scales coffee and water, with safe input boundaries", () => {
  assert.equal(ratioWater(20, 15), 300);
  assert.equal(ratioWater(30, 16), 480);
  assert.equal(ratioWater(0, 15), 15);
  assert.equal(ratioWater(1000, 100), 40000);
});

test("brew guide generates recipes for every included method", () => {
  const method = (slug, title, grind, time) => ({ slug, title, data: { grind, time, temperature: "93°C" } });
  const press = makeRecipe(method("french-press", "French press", "Coarse", "4 min"), 2, 1);
  assert.deepEqual(
    { coffee: press.coffee, liquid: press.liquid, ratio: press.ratio, grind: press.grind, time: press.time },
    { coffee: 30, liquid: 450, ratio: "1:15", grind: "Coarse", time: "4 min" }
  );

  const moka = makeRecipe(method("moka-pot", "Moka pot", "Medium-fine", "5–7 min"), 2);
  assert.deepEqual({ coffee: moka.coffee, liquid: moka.liquid, ratio: moka.ratio }, { coffee: 18, liquid: 180, ratio: "1:10" });

  const aeropress = makeRecipe(method("aeropress", "AeroPress", "Medium-fine", "2 min"), 2);
  assert.deepEqual({ coffee: aeropress.coffee, liquid: aeropress.liquid, ratio: aeropress.ratio }, { coffee: 30, liquid: 450, ratio: "1:15" });

  const espresso = makeRecipe(method("espresso", "Espresso", "Fine", "25–32 sec"), 2);
  assert.deepEqual({ coffee: espresso.coffee, liquid: espresso.liquid, ratio: espresso.ratio, unit: espresso.unit }, { coffee: 18, liquid: 36, ratio: "1:2", unit: "Shot yield" });

  const filter = makeRecipe(method("pour-over", "Pour-over", "Medium", "3 min"), 2);
  assert.deepEqual({ coffee: filter.coffee, liquid: filter.liquid, ratio: filter.ratio }, { coffee: 25, liquid: 400, ratio: "1:16" });

  const cold = makeRecipe(method("cold-brew", "Cold brew", "Extra coarse", "12–16 hr"), 1);
  assert.deepEqual({ coffee: cold.coffee, liquid: cold.liquid, ratio: cold.ratio }, { coffee: 25, liquid: 200, ratio: "1:8" });
});

test("cup count and strength personalize a brew without breaking its ratio", () => {
  const method = { slug: "french-press", title: "French press", data: { grind: "Coarse", time: "4 min" } };
  const gentle = makeRecipe(method, 2, 0.85);
  const bolder = makeRecipe(method, 3, 1.2);
  assert.equal(gentle.coffee, 25.5);
  assert.equal(gentle.liquid, 383);
  assert.equal(bolder.servings, 3);
  assert.equal(bolder.coffee, 54);
  assert.equal(bolder.liquid, 810);
  assert.equal(formatGrams(gentle.coffee), "25.5");
});
