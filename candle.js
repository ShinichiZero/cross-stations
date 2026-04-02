/**
 * candle.js – Virtual Candle state management (UMD)
 *
 * Handles localStorage reads/writes for the 14 Stations of the Cross candle
 * toggle feature. Strict input validation prevents injection attacks:
 * - Station numbers must be integers in [1, 14]
 * - Only the boolean strings 'true' / 'false' are ever written to storage
 */
/* global module */
var CandleStore = (function () {
  'use strict';

  var STATION_COUNT = 14;
  var KEY_PREFIX = 'station_candle_';

  /**
   * Return the whitelisted localStorage key for a station.
   * @param {number} stationNum  Integer 1–14.
   * @throws {RangeError} for any value outside the allowed set.
   */
  function getCandleKey(stationNum) {
    // Only accept primitive numbers or strings – reject objects, arrays, etc.
    if (typeof stationNum !== 'number' && typeof stationNum !== 'string') {
      throw new RangeError(
        'Station number must be a number or numeric string, received type: ' +
        typeof stationNum
      );
    }
    var num = Number(stationNum);
    if (!Number.isInteger(num) || num < 1 || num > STATION_COUNT) {
      throw new RangeError(
        'Station number must be an integer between 1 and ' + STATION_COUNT +
        ', received: ' + stationNum
      );
    }
    return KEY_PREFIX + num;
  }

  /**
   * Return whether the candle for stationNum is currently lit.
   * Falls back to false on any error (e.g. private-browsing storage denial).
   */
  function isLit(stationNum) {
    try {
      return localStorage.getItem(getCandleKey(stationNum)) === 'true';
    } catch (_) {
      return false;
    }
  }

  /**
   * Persist the lit state for stationNum.
   * @param {boolean} lit
   * @returns {boolean} true if the write succeeded.
   */
  function setLit(stationNum, lit) {
    try {
      // Only ever write the two safe strings 'true' / 'false'.
      localStorage.setItem(getCandleKey(stationNum), lit ? 'true' : 'false');
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Toggle the candle state and return the new state.
   * @returns {boolean} new lit state
   */
  function toggle(stationNum) {
    var next = !isLit(stationNum);
    setLit(stationNum, next);
    return next;
  }

  /**
   * Return a plain object mapping station numbers (1–14) to their lit states.
   */
  function loadAll() {
    var states = {};
    for (var i = 1; i <= STATION_COUNT; i++) {
      states[i] = isLit(i);
    }
    return states;
  }

  /** Remove all candle keys from localStorage. */
  function clearAll() {
    for (var i = 1; i <= STATION_COUNT; i++) {
      try {
        localStorage.removeItem(getCandleKey(i));
      } catch (_) {
        /* ignore */
      }
    }
  }

  var api = {
    getCandleKey: getCandleKey,
    isLit: isLit,
    setLit: setLit,
    toggle: toggle,
    loadAll: loadAll,
    clearAll: clearAll,
    STATION_COUNT: STATION_COUNT
  };

  // CommonJS export (Node.js / Jest)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  return api;
})();
