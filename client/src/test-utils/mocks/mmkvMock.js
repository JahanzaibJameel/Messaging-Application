const mockMMKV = jest.fn().mockImplementation((options) => ({
  set: jest.fn(),
  getString: jest.fn(),
  delete: jest.fn(),
  clearAll: jest.fn(),
  getAllKeys: jest.fn(() => []),
  getNumber: jest.fn(),
  getBoolean: jest.fn(),
  setString: jest.fn(),
  setNumber: jest.fn(),
  setBoolean: jest.fn(),
}));

const MMKV = mockMMKV;

module.exports = {
  mockMMKV,
  MMKV,
};