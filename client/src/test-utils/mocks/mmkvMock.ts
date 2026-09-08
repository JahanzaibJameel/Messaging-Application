export function MMKV(options: any) {
  return {
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
  };
}

export const mockMMKV = MMKV;
