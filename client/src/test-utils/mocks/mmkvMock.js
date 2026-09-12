/* global jest */

const mockMMKV = {
  set: () => {},
  getString: () => null,
  delete: () => {},
  clearAll: () => {},
  getAllKeys: () => [],
  getNumber: () => null,
  getBoolean: () => null,
  setString: () => {},
  setNumber: () => {},
  setBoolean: () => {},
};

const MMKV = mockMMKV;

module.exports = {
  mockMMKV,
  MMKV,
};
