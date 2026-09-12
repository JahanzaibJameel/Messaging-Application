/* global jest */

const mockMMKV = {
  set: jest.fn(),
  getString: jest.fn().mockReturnValue(null),
  delete: jest.fn(),
  clearAll: jest.fn(),
  getAllKeys: jest.fn().mockReturnValue([]),
  getNumber: jest.fn(),
  getBoolean: jest.fn(),
  setString: jest.fn(),
  setNumber: jest.fn(),
  setBoolean: jest.fn(),
};

const MMKV = mockMMKV;

module.exports = {
  mockMMKV,
  MMKV,
};
