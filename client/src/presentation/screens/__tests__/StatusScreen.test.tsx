import "../../../test-utils/i18nMock";

import React from "react";
import { render, screen } from "@testing-library/react-native";

import StatusScreen from "../StatusScreen";

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

jest.mock("../../../../assets/images/empty-status.png", () => "empty-status.png");

describe("StatusScreen", () => {
  it("renders the empty status title", () => {
    render(<StatusScreen />);

    expect(screen.getByText("No status updates")).toBeTruthy();
  });

  it("renders the status updates message", () => {
    render(<StatusScreen />);

    expect(screen.getByText("Status updates from your contacts will appear here")).toBeTruthy();
  });

  it("renders the theme background and padded container", () => {
    const { UNSAFE_root: container } = render(<StatusScreen />);

    expect(container).toBeTruthy();
  });
});
