const fs = require("fs");

const testCode = `
jest.mock("react-native-keychain", () => ({
  __esModule: true,
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
}));

const { setToken, getToken } = require("../security/keychain");

describe("token check in integration dir", () => {
  it("should work from integration dir", async () => {
    await setToken("test-token");
    const tokens = await getToken();
    fs.writeFileSync("D:\\\\reactnative\\\\Messaging-Application\\\\token_check4.txt",
      "accessToken: " + tokens.accessToken + "\\n"
    );
    expect(tokens.accessToken).toBe("test-token");
  });
});
`;

fs.writeFileSync("client/src/__tests__/integration/token_check4.test.ts", testCode);
console.log("Test created");
