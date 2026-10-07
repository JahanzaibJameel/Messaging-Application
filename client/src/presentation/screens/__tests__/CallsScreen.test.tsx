import "../../../test-utils/i18nMock";

import React from "react";
import { render, screen } from "@testing-library/react-native";

import CallsScreen from "../CallsScreen";

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => 56,
}));

jest.mock("@react-navigation/bottom-tabs", () => ({
  useBottomTabBarHeight: () => 80,
}));

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: {
      backgroundRoot: "#fff",
      text: "#000",
      textSecondary: "#666",
      primary: "#007AFF",
      surface: "#f5f5f5",
      divider: "#ddd",
    },
  }),
}));

jest.mock("../../../../assets/images/empty-calls.png", () => "empty-calls.png");

describe("CallsScreen", () => {
  it("renders the empty calls title", () => {
    render(<CallsScreen />);

    expect(screen.getByText("No recent calls")).toBeTruthy();
  });

  it("renders the call history message", () => {
    render(<CallsScreen />);

    expect(screen.getByText("Your call history will appear here")).toBeTruthy();
  });

  it("renders the theme background and padded container", () => {
    const { UNSAFE_root: container } = render(<CallsScreen />);

    expect(container).toBeTruthy();
  });
});
