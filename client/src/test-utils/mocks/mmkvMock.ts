export const mockMMKV = jest.fn().mockImplementation(() => ({
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

export const MMKV = mockMMKV;
