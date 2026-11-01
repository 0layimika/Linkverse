import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { calculateGiftFee, parseGiftFeePercent } from './gift-fee';

test('gift fees use cents/kobo with half-up rounding', () => {
    assert.deepEqual(calculateGiftFee(10, 2), { rate_percent: 2, amount_minor: 20 });
    assert.equal(calculateGiftFee(1000, 2).amount_minor, 2000);
    assert.equal(calculateGiftFee(1.25, 2).amount_minor, 3);
    assert.equal(calculateGiftFee(10, 2.75).amount_minor, 28);
    assert.equal(calculateGiftFee(10, 0).amount_minor, 0);
    assert.equal(calculateGiftFee(10, 100).amount_minor, 1000);
});

test('fee configuration rejects invalid rates instead of silently changing fees', () => {
    assert.equal(parseGiftFeePercent('2'), 2);
    assert.equal(parseGiftFeePercent('0'), 0);
    for (const value of ['', 'NaN', 'Infinity', '-2', '101', '2%', '0.001']) {
        assert.throws(() => parseGiftFeePercent(value), /GIFT_FEE_PERCENT/);
    }
    assert.throws(() => calculateGiftFee(NaN, 2));
    assert.throws(() => calculateGiftFee(0, 2));
    assert.throws(() => calculateGiftFee(Number.MAX_SAFE_INTEGER, 2));
});
