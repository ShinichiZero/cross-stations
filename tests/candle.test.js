'use strict';

/**
 * Unit tests for candle.js – Virtual Candle localStorage toggle logic.
 * Written Red-Green TDD style: tests define expected behaviour before
 * (or alongside) implementation.
 */

const CandleStore = require('../candle');

// ─── localStorage mock ───────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store = {};
  return {
    getItem:    (key)        => Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null,
    setItem:    (key, value) => { store[key] = String(value); },
    removeItem: (key)        => { delete store[key]; },
    clear:      ()           => { store = {}; },
    _store:     ()           => store
  };
})();

Object.defineProperty(global, 'localStorage', {
  value:    localStorageMock,
  writable: false
});

beforeEach(() => {
  localStorageMock.clear();
});

// ─── getCandleKey ─────────────────────────────────────────────────────────────
describe('getCandleKey', () => {
  test('returns correct key for station 1', () => {
    expect(CandleStore.getCandleKey(1)).toBe('station_candle_1');
  });

  test('returns correct key for station 14', () => {
    expect(CandleStore.getCandleKey(14)).toBe('station_candle_14');
  });

  test('returns correct key for mid-range station 7', () => {
    expect(CandleStore.getCandleKey(7)).toBe('station_candle_7');
  });

  test('throws RangeError for station 0', () => {
    expect(() => CandleStore.getCandleKey(0)).toThrow(RangeError);
  });

  test('throws RangeError for station 15', () => {
    expect(() => CandleStore.getCandleKey(15)).toThrow(RangeError);
  });

  test('throws RangeError for negative numbers', () => {
    expect(() => CandleStore.getCandleKey(-1)).toThrow(RangeError);
  });

  test('throws RangeError for floating-point numbers', () => {
    expect(() => CandleStore.getCandleKey(1.5)).toThrow(RangeError);
  });

  test('throws RangeError for NaN', () => {
    expect(() => CandleStore.getCandleKey(NaN)).toThrow(RangeError);
  });

  // Injection-protection tests
  test('rejects script-injection string', () => {
    expect(() => CandleStore.getCandleKey('<script>alert(1)</script>')).toThrow(RangeError);
  });

  test('rejects __proto__ key poisoning attempt', () => {
    expect(() => CandleStore.getCandleKey('__proto__')).toThrow(RangeError);
  });

  test('rejects constructor property attempt', () => {
    expect(() => CandleStore.getCandleKey('constructor')).toThrow(RangeError);
  });

  test('rejects very large numbers', () => {
    expect(() => CandleStore.getCandleKey(9999)).toThrow(RangeError);
  });

  test('rejects objects', () => {
    expect(() => CandleStore.getCandleKey({ valueOf: () => 1 })).toThrow(RangeError);
  });

  test('rejects undefined', () => {
    expect(() => CandleStore.getCandleKey(undefined)).toThrow(RangeError);
  });

  test('rejects null', () => {
    expect(() => CandleStore.getCandleKey(null)).toThrow(RangeError);
  });
});

// ─── isLit ────────────────────────────────────────────────────────────────────
describe('isLit', () => {
  test('returns false when nothing is stored', () => {
    expect(CandleStore.isLit(1)).toBe(false);
  });

  test('returns true after setLit(n, true)', () => {
    CandleStore.setLit(1, true);
    expect(CandleStore.isLit(1)).toBe(true);
  });

  test('returns false after setLit(n, false)', () => {
    CandleStore.setLit(1, true);
    CandleStore.setLit(1, false);
    expect(CandleStore.isLit(1)).toBe(false);
  });

  test('each station is independent', () => {
    CandleStore.setLit(2, true);
    expect(CandleStore.isLit(1)).toBe(false);
    expect(CandleStore.isLit(2)).toBe(true);
    expect(CandleStore.isLit(3)).toBe(false);
  });
});

// ─── setLit ───────────────────────────────────────────────────────────────────
describe('setLit', () => {
  test('returns true on success', () => {
    expect(CandleStore.setLit(1, true)).toBe(true);
  });

  test('only writes the string "true" when lit', () => {
    CandleStore.setLit(5, true);
    const raw = localStorageMock._store()['station_candle_5'];
    expect(raw).toBe('true');
  });

  test('only writes the string "false" when not lit', () => {
    CandleStore.setLit(5, false);
    const raw = localStorageMock._store()['station_candle_5'];
    expect(raw).toBe('false');
  });
});

// ─── toggle ───────────────────────────────────────────────────────────────────
describe('toggle', () => {
  test('toggles an unlit candle to lit and returns true', () => {
    const result = CandleStore.toggle(1);
    expect(result).toBe(true);
    expect(CandleStore.isLit(1)).toBe(true);
  });

  test('toggles a lit candle to unlit and returns false', () => {
    CandleStore.setLit(1, true);
    const result = CandleStore.toggle(1);
    expect(result).toBe(false);
    expect(CandleStore.isLit(1)).toBe(false);
  });

  test('double toggle restores original state (false)', () => {
    CandleStore.toggle(1);
    CandleStore.toggle(1);
    expect(CandleStore.isLit(1)).toBe(false);
  });

  test('double toggle restores original state (true)', () => {
    CandleStore.setLit(1, true);
    CandleStore.toggle(1);
    CandleStore.toggle(1);
    expect(CandleStore.isLit(1)).toBe(true);
  });

  test('toggling one station does not affect others', () => {
    CandleStore.toggle(3);
    for (let i = 1; i <= 14; i++) {
      if (i !== 3) {
        expect(CandleStore.isLit(i)).toBe(false);
      }
    }
  });
});

// ─── loadAll ─────────────────────────────────────────────────────────────────
describe('loadAll', () => {
  test('returns an object with 14 keys', () => {
    const states = CandleStore.loadAll();
    expect(Object.keys(states)).toHaveLength(14);
  });

  test('all stations start as false', () => {
    const states = CandleStore.loadAll();
    for (let i = 1; i <= 14; i++) {
      expect(states[i]).toBe(false);
    }
  });

  test('reflects lit stations correctly', () => {
    CandleStore.setLit(3, true);
    CandleStore.setLit(7, true);
    const states = CandleStore.loadAll();
    expect(states[3]).toBe(true);
    expect(states[7]).toBe(true);
    expect(states[1]).toBe(false);
    expect(states[14]).toBe(false);
  });
});

// ─── clearAll ─────────────────────────────────────────────────────────────────
describe('clearAll', () => {
  test('clears all candle states', () => {
    for (let i = 1; i <= 14; i++) CandleStore.setLit(i, true);
    CandleStore.clearAll();
    for (let i = 1; i <= 14; i++) {
      expect(CandleStore.isLit(i)).toBe(false);
    }
  });

  test('does not affect unrelated localStorage keys', () => {
    localStorageMock.setItem('other_key', 'some_value');
    CandleStore.clearAll();
    expect(localStorageMock.getItem('other_key')).toBe('some_value');
  });
});

// ─── STATION_COUNT constant ───────────────────────────────────────────────────
describe('STATION_COUNT', () => {
  test('equals 14', () => {
    expect(CandleStore.STATION_COUNT).toBe(14);
  });
});
