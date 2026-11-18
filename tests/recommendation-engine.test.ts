import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Recipe Matching & Recommendation Logic Unit Tests', () => {
  const ROLE_WEIGHTS: Record<string, number> = {
    MAIN: 5,
    SECONDARY: 3,
    FLAVORING: 1,
    GARNISH: 1,
    PANTRY_STAPLE: 0,
    OPTIONAL: 0,
  };

  function calculateMatch(
    recipeIngredients: Array<{ name: string; role: string; isOptional?: boolean }>,
    availableIngredients: string[]
  ) {
    const availableSet = new Set(availableIngredients.map((i) => i.toLowerCase().trim()));
    let totalWeight = 0;
    let matchedWeight = 0;
    let missingMainCount = 0;
    const missing: string[] = [];

    for (const ri of recipeIngredients) {
      const isMatched = availableSet.has(ri.name.toLowerCase().trim());
      const role = ri.role;
      const isOptional = ri.isOptional || role === 'OPTIONAL';
      const isStaple = role === 'PANTRY_STAPLE';

      if (isStaple || isOptional) {
        continue;
      }

      const weight = ROLE_WEIGHTS[role] ?? 3;
      totalWeight += weight;

      if (isMatched) {
        matchedWeight += weight;
      } else {
        missing.push(ri.name);
        if (role === 'MAIN') {
          missingMainCount++;
        }
      }
    }

    const percentage = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 100;

    let classification: 'COOK_NOW' | 'ALMOST_READY' | 'NEED_INGREDIENTS' = 'NEED_INGREDIENTS';
    if (percentage >= 85 && missingMainCount === 0 && missing.length <= 1) {
      classification = 'COOK_NOW';
    } else if (percentage >= 50 && missingMainCount <= 1 && missing.length <= 3) {
      classification = 'ALMOST_READY';
    }

    return { percentage, classification, missingMainCount, missingCount: missing.length };
  }

  test('Full match classifies as COOK_NOW with 100% score', () => {
    const recipe = [
      { name: 'Paneer', role: 'MAIN' },
      { name: 'Tomato', role: 'SECONDARY' },
      { name: 'Butter', role: 'FLAVORING' },
      { name: 'Salt', role: 'PANTRY_STAPLE' },
      { name: 'Coriander', role: 'OPTIONAL' },
    ];
    const available = ['Paneer', 'Tomato', 'Butter', 'Salt'];
    const result = calculateMatch(recipe, available);

    assert.equal(result.percentage, 100);
    assert.equal(result.classification, 'COOK_NOW');
    assert.equal(result.missingMainCount, 0);
  });

  test('Missing MAIN ingredient prevents COOK_NOW even with high percentage', () => {
    const recipe = [
      { name: 'Chicken', role: 'MAIN' },       // Weight 5
      { name: 'Onion', role: 'SECONDARY' },     // Weight 3
      { name: 'Tomato', role: 'SECONDARY' },    // Weight 3
      { name: 'Garlic', role: 'FLAVORING' },    // Weight 1
      { name: 'Ginger', role: 'FLAVORING' },    // Weight 1
    ];
    // Total weight: 5 + 3 + 3 + 1 + 1 = 13
    // Matched: Onion, Tomato, Garlic, Ginger = 8
    // Score: 8/13 = 62%
    const available = ['Onion', 'Tomato', 'Garlic', 'Ginger'];
    const result = calculateMatch(recipe, available);

    assert.equal(result.missingMainCount, 1);
    assert.notEqual(result.classification, 'COOK_NOW');
    assert.equal(result.classification, 'ALMOST_READY');
  });

  test('Optional ingredients do not penalize required score', () => {
    const recipe = [
      { name: 'Potato', role: 'MAIN' },        // Weight 5
      { name: 'Cumin Seeds', role: 'FLAVORING' }, // Weight 1
      { name: 'Kasuri Methi', role: 'OPTIONAL' }, // Weight 0
    ];
    const available = ['Potato', 'Cumin Seeds'];
    const result = calculateMatch(recipe, available);

    assert.equal(result.percentage, 100);
    assert.equal(result.classification, 'COOK_NOW');
  });

  test('Pantry staples do not cause match penalty', () => {
    const recipe = [
      { name: 'Rice', role: 'MAIN' },
      { name: 'Water', role: 'PANTRY_STAPLE' },
      { name: 'Salt', role: 'PANTRY_STAPLE' },
    ];
    const available = ['Rice'];
    const result = calculateMatch(recipe, available);

    assert.equal(result.percentage, 100);
    assert.equal(result.classification, 'COOK_NOW');
  });
});
