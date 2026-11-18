import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeIngredientName, generateSlug } from '../src/lib/ingredient-service';

describe('Ingredient Service & Normalization Tests', () => {
  test('normalizeIngredientName handles mixed cases and extra whitespace', () => {
    assert.equal(normalizeIngredientName('  POTATO  '), 'potato');
    assert.equal(normalizeIngredientName('Green   Chilli'), 'green chilli');
    assert.equal(normalizeIngredientName('Cottage   Cheese  (Paneer)'), 'cottage cheese (paneer)');
  });

  test('generateSlug generates clean URL-friendly slugs', () => {
    assert.equal(generateSlug('Potato'), 'potato');
    assert.equal(generateSlug('Garam & Chaat Masala'), 'garam-and-chaat-masala');
    assert.equal(generateSlug('Extra-Virgin Olive Oil!'), 'extra-virgin-olive-oil');
    assert.equal(generateSlug('  100% Whole Wheat Flour  '), '100-whole-wheat-flour');
  });

  test('generateSlug strips leading/trailing dashes and collapses multiples', () => {
    assert.equal(generateSlug('---Apple---Cider---'), 'apple-cider');
    assert.equal(generateSlug('Salt & Pepper'), 'salt-and-pepper');
  });
});
