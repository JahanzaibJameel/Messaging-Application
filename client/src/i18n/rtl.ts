import React from "react";
import { I18nManager } from "react-native";
import i18n from "./index";

/**
 * Applies RTL layout configuration based on current language direction
 * Call this after language changes to ensure proper RTL/LTR layout
 */
export const applyRTL = () => {
  const isRTL = i18n.dir() === "rtl";

  // Only update if the current direction differs from the device setting
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);

    // Note: In a real app, you might need to restart the app or re-render the root
    // For most cases, React Native will handle the layout direction change automatically
  }

  return isRTL;
};

/**
 * Hook that returns whether the current layout should be RTL
 * and applies RTL configuration when language changes
 */
export const useRTL = () => {
  const [isRTL, setIsRTL] = React.useState(i18n.dir() === "rtl");

  React.useEffect(() => {
    const handleLanguageChange = () => {
      const newIsRTL = i18n.dir() === "rtl";
      if (newIsRTL !== isRTL) {
        setIsRTL(newIsRTL);
        applyRTL();
      }
    };

    // Apply initial RTL configuration
    applyRTL();

    // Listen for language changes (you'll need to set up this listener in your i18n config)
    // For now, we'll check periodically or when components re-render
    const checkInterval = setInterval(() => {
      const currentIsRTL = i18n.dir() === "rtl";
      if (currentIsRTL !== isRTL) {
        handleLanguageChange();
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [isRTL]);

  return isRTL;
};

/**
 * Helper function to get text alignment based on current language direction
 */
export const getTextAlign = (align: "auto" | "left" | "right" | "center" = "auto") => {
  if (align === "auto") {
    return i18n.dir() === "rtl" ? "right" : "left";
  }
  return align;
};

/**
 * Helper function to get margin/padding values that respect RTL
 * Use start/end instead of left/right for RTL compatibility
 */
export const getDirectionalStyle = (
  start?: number,
  end?: number,
  top?: number,
  bottom?: number
) => {
  const isRTL = i18n.dir() === "rtl";

  return {
    ...(top !== undefined && { marginTop: top }),
    ...(bottom !== undefined && { marginBottom: bottom }),
    ...(start !== undefined && { [isRTL ? "marginRight" : "marginLeft"]: start }),
    ...(end !== undefined && { [isRTL ? "marginLeft" : "marginRight"]: end }),
  };
};

/**
 * Helper function to get padding that respects RTL
 */
export const getDirectionalPadding = (
  start?: number,
  end?: number,
  top?: number,
  bottom?: number
) => {
  const isRTL = i18n.dir() === "rtl";

  return {
    ...(top !== undefined && { paddingTop: top }),
    ...(bottom !== undefined && { paddingBottom: bottom }),
    ...(start !== undefined && { [isRTL ? "paddingRight" : "paddingLeft"]: start }),
    ...(end !== undefined && { [isRTL ? "paddingLeft" : "paddingRight"]: end }),
  };
};

/**
 * Get writing direction for text elements
 */
export const getWritingDirection = (): "ltr" | "rtl" => {
  return i18n.dir() as "ltr" | "rtl";
};
