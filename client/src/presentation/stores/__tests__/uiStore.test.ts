import type { Toast, UIState } from "../types";
import { useUIStore } from "../uiStore";

const initialUIState: UIState = {
  toasts: [],
  isOnline: true,
  isSyncing: false,
  searchQuery: "",
  showSearch: false,
  typingIndicators: undefined,
};

const resetStore = (): void => {
  useUIStore.setState({ ...initialUIState });
};

const toastCount = (): number => useUIStore.getState().toasts.length;

const visibleToastIds = (): string[] => useUIStore.getState().toasts.map((t) => t.id);

describe("uiStore", () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("initial state", () => {
    it("starts with no toasts and neutral connectivity/search flags", () => {
      const state = useUIStore.getState();

      expect(state.toasts).toEqual([]);
      expect(state.isOnline).toBe(true);
      expect(state.isSyncing).toBe(false);
      expect(state.searchQuery).toBe("");
      expect(state.showSearch).toBe(false);
    });

    it("has no typingIndicators map until an indicator is published", () => {
      expect(useUIStore.getState().typingIndicators).toBeUndefined();
    });

    it("exposes every action and no unexpected state keys", () => {
      const state = useUIStore.getState();

      expect(Object.keys(state).sort()).toEqual(
        [
          "clearTypingIndicators",
          "hideToast",
          "isOnline",
          "isSyncing",
          "searchQuery",
          "setOnline",
          "setSearchQuery",
          "setShowSearch",
          "setSyncing",
          "setTypingIndicators",
          "showSearch",
          "showToast",
          "toasts",
          "typingIndicators",
        ].sort()
      );
      expect(typeof state.showToast).toBe("function");
      expect(typeof state.hideToast).toBe("function");
      expect(typeof state.setTypingIndicators).toBe("function");
      expect(typeof state.clearTypingIndicators).toBe("function");
    });
  });

  describe("showToast", () => {
    it("stores the toast with a generated id", () => {
      const id = useUIStore.getState().showToast({ type: "success", message: "Saved" });

      const toasts = useUIStore.getState().toasts;
      expect(toastCount()).toBe(1);
      expect(toasts[0]).toEqual({ type: "success", message: "Saved", id });
    });

    it("REGRESSION: returns the id so a toast can be dismissed before its timer", () => {
      jest.useFakeTimers();
      const longToast = "a toast the user dismisses";

      // The returned id is typed as `string` (UIActions.showToast). Before that
      // signature fix this expression would not compile, so the ability to
      // dismiss a toast early was untestable and unreachable for typed callers.
      const id = useUIStore
        .getState()
        .showToast({ type: "info", message: longToast, duration: 10_000 });

      expect(id).toMatch(/^toast_\d+_[a-z0-9]{9}$/);
      expect(useUIStore.getState().toasts[0].id).toBe(id);

      useUIStore.getState().hideToast(id);

      expect(toastCount()).toBe(0);
      // The scheduled auto-hide must not resurrect or throw afterwards.
      expect(() => jest.advanceTimersByTime(10_000)).not.toThrow();
      expect(toastCount()).toBe(0);
    });

    it.each(["success", "error", "warning", "info"] as const)(
      "preserves the %s toast type verbatim",
      (type) => {
        useUIStore.getState().showToast({ type, message: `${type} message` });

        expect(useUIStore.getState().toasts[0].type).toBe(type);
      }
    );

    it("preserves the optional action handler", () => {
      const onPress = jest.fn();

      useUIStore
        .getState()
        .showToast({ type: "warning", message: "Undo?", action: { label: "Undo", onPress } });

      const toast = useUIStore.getState().toasts[0];
      expect(toast.action?.label).toBe("Undo");
      toast.action?.onPress();
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("stacks several toasts in insertion order", () => {
      const first = useUIStore.getState().showToast({ type: "info", message: "one" });
      const second = useUIStore.getState().showToast({ type: "info", message: "two" });
      const third = useUIStore.getState().showToast({ type: "info", message: "three" });

      expect(visibleToastIds()).toEqual([first, second, third]);
      expect(useUIStore.getState().toasts.map((t) => t.message)).toEqual(["one", "two", "three"]);
    });

    it("generates distinct ids even when Date.now is frozen", () => {
      jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

      const ids = [
        useUIStore.getState().showToast({ type: "info", message: "a" }),
        useUIStore.getState().showToast({ type: "info", message: "b" }),
        useUIStore.getState().showToast({ type: "info", message: "c" }),
      ];

      expect(ids[0]).toMatch(/^toast_1700000000000_/);
      expect(new Set(ids).size).toBe(3);
      expect(visibleToastIds()).toEqual(ids);
    });

    it("auto-hides the toast after the default 3000ms", () => {
      jest.useFakeTimers();
      const id = useUIStore.getState().showToast({ type: "info", message: "auto" });

      expect(jest.getTimerCount()).toBe(1);
      expect(toastCount()).toBe(1);

      jest.advanceTimersByTime(2_999);
      expect(visibleToastIds()).toEqual([id]);

      jest.advanceTimersByTime(1);
      expect(toastCount()).toBe(0);
    });

    it("auto-hides after the requested duration", () => {
      jest.useFakeTimers();
      const id = useUIStore
        .getState()
        .showToast({ type: "info", message: "custom", duration: 10_000 });

      jest.advanceTimersByTime(9_999);
      expect(visibleToastIds()).toEqual([id]);

      jest.advanceTimersByTime(1);
      expect(toastCount()).toBe(0);
    });

    it("REGRESSION: honours an explicit duration of 0 instead of defaulting to 3000ms", () => {
      jest.useFakeTimers();
      const id = useUIStore.getState().showToast({ type: "info", message: "instant", duration: 0 });

      // Before the `??` fix, `duration || 3000` treated 0 as unset, so the toast
      // survived here and only disappeared 3000ms later.
      jest.advanceTimersByTime(0);
      expect(useUIStore.getState().toasts).toEqual([]);

      jest.advanceTimersByTime(3_000);
      expect(toastCount()).toBe(0);
      expect(id).toMatch(/^toast_/);
    });

    it("auto-hides each toast on its own schedule", () => {
      jest.useFakeTimers();
      const quick = useUIStore
        .getState()
        .showToast({ type: "info", message: "quick", duration: 1_000 });
      const slow = useUIStore
        .getState()
        .showToast({ type: "info", message: "slow", duration: 5_000 });

      expect(jest.getTimerCount()).toBe(2);

      jest.advanceTimersByTime(1_000);
      expect(visibleToastIds()).toEqual([slow]);

      jest.advanceTimersByTime(4_000);
      expect(toastCount()).toBe(0);
    });

    it("leaves a longer-lived toast alone when a shorter one auto-hides", () => {
      jest.useFakeTimers();
      const scheduled = useUIStore
        .getState()
        .showToast({ type: "info", message: "short", duration: 1_000 });
      const longLived = useUIStore
        .getState()
        .showToast({ type: "info", message: "long", duration: 30_000 });

      jest.advanceTimersByTime(1_000);

      expect(visibleToastIds()).toEqual([longLived]);
      expect(visibleToastIds()).not.toContain(scheduled);
    });

    it("leaves an already-hidden toast alone when its timer fires", () => {
      jest.useFakeTimers();
      const id = useUIStore
        .getState()
        .showToast({ type: "info", message: "manual", duration: 500 });

      useUIStore.getState().hideToast(id);
      expect(toastCount()).toBe(0);

      expect(() => jest.advanceTimersByTime(500)).not.toThrow();
      expect(toastCount()).toBe(0);
    });

    it("never mutates the object the caller passed in", () => {
      const payload: Omit<Toast, "id"> = { type: "info", message: "immutable" };

      useUIStore.getState().showToast(payload);

      expect(payload).toEqual({ type: "info", message: "immutable" });
      expect(payload).not.toHaveProperty("id");
      expect(useUIStore.getState().toasts[0].message).toBe("immutable");
    });

    it("keeps toasts independent across separate show/hide cycles", () => {
      const first = useUIStore.getState().showToast({ type: "success", message: "first" });
      useUIStore.getState().hideToast(first);

      const second = useUIStore.getState().showToast({ type: "error", message: "second" });

      expect(visibleToastIds()).toEqual([second]);
      expect(useUIStore.getState().toasts[0].type).toBe("error");
    });
  });

  describe("hideToast", () => {
    it("removes only the matching toast", () => {
      const first = useUIStore.getState().showToast({ type: "info", message: "one" });
      const second = useUIStore.getState().showToast({ type: "info", message: "two" });

      useUIStore.getState().hideToast(first);

      expect(visibleToastIds()).toEqual([second]);
      expect(useUIStore.getState().toasts[0].message).toBe("two");
    });

    it("removes a toast from the middle of the stack", () => {
      const first = useUIStore.getState().showToast({ type: "info", message: "one" });
      const middle = useUIStore.getState().showToast({ type: "info", message: "two" });
      const last = useUIStore.getState().showToast({ type: "info", message: "three" });

      useUIStore.getState().hideToast(middle);

      expect(visibleToastIds()).toEqual([first, last]);
    });

    it("is a no-op for an unknown id and preserves every toast", () => {
      const id = useUIStore.getState().showToast({ type: "info", message: "kept" });

      expect(() => useUIStore.getState().hideToast("toast_does_not_exist")).not.toThrow();

      expect(visibleToastIds()).toEqual([id]);
    });

    it("is a no-op when called twice for the same id", () => {
      const first = useUIStore.getState().showToast({ type: "info", message: "one" });
      useUIStore.getState().showToast({ type: "info", message: "two" });

      useUIStore.getState().hideToast(first);
      useUIStore.getState().hideToast(first);

      expect(toastCount()).toBe(1);
      expect(useUIStore.getState().toasts[0].message).toBe("two");
    });

    it("does not touch unrelated state", () => {
      useUIStore.getState().setOnline(false);
      useUIStore.getState().setSyncing(true);
      const id = useUIStore.getState().showToast({ type: "info", message: "gone" });

      useUIStore.getState().hideToast(id);

      const state = useUIStore.getState();
      expect(state.isOnline).toBe(false);
      expect(state.isSyncing).toBe(true);
      expect(state.toasts).toEqual([]);
    });
  });

  describe("setOnline", () => {
    it.each([true, false])("writes isOnline=%s", (value) => {
      useUIStore.getState().setOnline(!value);
      expect(useUIStore.getState().isOnline).toBe(!value);

      useUIStore.getState().setOnline(value);

      expect(useUIStore.getState().isOnline).toBe(value);
    });

    it("can be toggled repeatedly", () => {
      const { setOnline } = useUIStore.getState();

      setOnline(false);
      expect(useUIStore.getState().isOnline).toBe(false);
      setOnline(true);
      expect(useUIStore.getState().isOnline).toBe(true);
      setOnline(false);
      expect(useUIStore.getState().isOnline).toBe(false);
    });

    it("does not change isSyncing", () => {
      useUIStore.getState().setSyncing(true);

      useUIStore.getState().setOnline(false);

      expect(useUIStore.getState().isSyncing).toBe(true);
    });
  });

  describe("setSyncing", () => {
    it.each([true, false])("writes isSyncing=%s", (value) => {
      useUIStore.getState().setSyncing(!value);
      expect(useUIStore.getState().isSyncing).toBe(!value);

      useUIStore.getState().setSyncing(value);

      expect(useUIStore.getState().isSyncing).toBe(value);
    });

    it("does not change isOnline", () => {
      useUIStore.getState().setOnline(false);

      useUIStore.getState().setSyncing(true);

      expect(useUIStore.getState().isOnline).toBe(false);
    });
  });

  describe("setSearchQuery", () => {
    it("stores the query text", () => {
      useUIStore.getState().setSearchQuery("holiday");

      expect(useUIStore.getState().searchQuery).toBe("holiday");
    });

    it("clears the query with an empty string", () => {
      useUIStore.getState().setSearchQuery("holiday");

      useUIStore.getState().setSearchQuery("");

      expect(useUIStore.getState().searchQuery).toBe("");
    });

    it("does not open the search bar on its own", () => {
      useUIStore.getState().setSearchQuery("holiday");

      expect(useUIStore.getState().showSearch).toBe(false);
    });

    it("supports repeated edits of a growing query", () => {
      const { setSearchQuery } = useUIStore.getState();

      setSearchQuery("h");
      expect(useUIStore.getState().searchQuery).toBe("h");
      setSearchQuery("ho");
      expect(useUIStore.getState().searchQuery).toBe("ho");
      setSearchQuery("hol");
      expect(useUIStore.getState().searchQuery).toBe("hol");
    });
  });

  describe("setShowSearch", () => {
    it.each([true, false])("writes showSearch=%s", (value) => {
      useUIStore.getState().setShowSearch(!value);
      expect(useUIStore.getState().showSearch).toBe(!value);

      useUIStore.getState().setShowSearch(value);

      expect(useUIStore.getState().showSearch).toBe(value);
    });

    it("can be closed without clearing the existing query", () => {
      useUIStore.getState().setShowSearch(true);
      useUIStore.getState().setSearchQuery("holiday");

      useUIStore.getState().setShowSearch(false);

      const state = useUIStore.getState();
      expect(state.showSearch).toBe(false);
      expect(state.searchQuery).toBe("holiday");
    });
  });

  describe("setTypingIndicators", () => {
    const indicators = (text: string, isAnyoneTyping = true) => ({
      users: [{ id: "user-2" }],
      text,
      isAnyoneTyping,
    });

    it("creates the map on the first publish", () => {
      useUIStore.getState().setTypingIndicators("chat-1", indicators("Ada is typing…"));

      const map = useUIStore.getState().typingIndicators;
      expect(map).toBeDefined();
      expect(Object.keys(map ?? {})).toEqual(["chat-1"]);
      expect(map?.["chat-1"]).toEqual({
        users: [{ id: "user-2" }],
        text: "Ada is typing…",
        isAnyoneTyping: true,
      });
    });

    it("reuses the existing map for a second chat", () => {
      const { setTypingIndicators } = useUIStore.getState();

      setTypingIndicators("chat-1", indicators("first"));
      setTypingIndicators("chat-2", indicators("second"));

      const map = useUIStore.getState().typingIndicators;
      expect(Object.keys(map ?? {}).sort()).toEqual(["chat-1", "chat-2"]);
      expect(map?.["chat-1"].text).toBe("first");
      expect(map?.["chat-2"].text).toBe("second");
    });

    it("overwrites the entry for a chat that already has indicators", () => {
      const { setTypingIndicators } = useUIStore.getState();

      setTypingIndicators("chat-1", indicators("typing"));
      setTypingIndicators("chat-1", indicators("done", false));

      const map = useUIStore.getState().typingIndicators;
      expect(Object.keys(map ?? {})).toEqual(["chat-1"]);
      expect(map?.["chat-1"].text).toBe("done");
      expect(map?.["chat-1"].isAnyoneTyping).toBe(false);
    });

    it("stores an empty user list and a falsy isAnyoneTyping", () => {
      useUIStore
        .getState()
        .setTypingIndicators("chat-1", { users: [], text: "", isAnyoneTyping: false });

      expect(useUIStore.getState().typingIndicators?.["chat-1"]).toEqual({
        users: [],
        text: "",
        isAnyoneTyping: false,
      });
    });

    it("keeps chats isolated from each other", () => {
      const { setTypingIndicators } = useUIStore.getState();

      setTypingIndicators("chat-1", indicators("one"));
      setTypingIndicators("chat-2", indicators("two"));
      setTypingIndicators("chat-1", indicators("one again"));

      const map = useUIStore.getState().typingIndicators;
      expect(map?.["chat-1"].text).toBe("one again");
      expect(map?.["chat-2"].text).toBe("two");
    });

    it("does not disturb toasts or connectivity flags", () => {
      useUIStore.getState().setOnline(false);
      useUIStore.getState().showToast({ type: "info", message: "still here" });

      useUIStore.getState().setTypingIndicators("chat-1", indicators("typing"));

      const state = useUIStore.getState();
      expect(state.isOnline).toBe(false);
      expect(state.toasts).toHaveLength(1);
      expect(state.typingIndicators?.["chat-1"].isAnyoneTyping).toBe(true);
    });

    it("notifies subscribers when indicators change", () => {
      const listener = jest.fn();
      const unsubscribe = useUIStore.subscribe(listener);

      useUIStore.getState().setTypingIndicators("chat-1", indicators("typing"));

      expect(listener).toHaveBeenCalledTimes(1);
      unsubscribe();
    });
  });

  describe("clearTypingIndicators", () => {
    const indicators = (text: string) => ({
      users: [{ id: "user-2" }],
      text,
      isAnyoneTyping: true,
    });

    it("REGRESSION: removes the chat's entry instead of leaving an empty one", () => {
      const { setTypingIndicators, clearTypingIndicators } = useUIStore.getState();

      setTypingIndicators("chat-1", indicators("typing"));
      setTypingIndicators("chat-2", indicators("other"));

      clearTypingIndicators("chat-1");

      const map = useUIStore.getState().typingIndicators;
      expect(Object.keys(map ?? {})).toEqual(["chat-2"]);
      expect(map?.["chat-1"]).toBeUndefined();
      expect(map?.["chat-2"].text).toBe("other");
    });

    it("leaves an empty map rather than undefined once the last chat is cleared", () => {
      const { setTypingIndicators, clearTypingIndicators } = useUIStore.getState();

      setTypingIndicators("chat-1", indicators("typing"));
      clearTypingIndicators("chat-1");

      expect(useUIStore.getState().typingIndicators).toEqual({});
    });

    it("is a no-op before any indicator has been published", () => {
      expect(() => useUIStore.getState().clearTypingIndicators("chat-1")).not.toThrow();

      expect(useUIStore.getState().typingIndicators).toBeUndefined();
    });

    it("is a no-op for a chat that has no indicators", () => {
      const { setTypingIndicators, clearTypingIndicators } = useUIStore.getState();

      setTypingIndicators("chat-1", indicators("typing"));
      clearTypingIndicators("chat-unknown");

      expect(Object.keys(useUIStore.getState().typingIndicators ?? {})).toEqual(["chat-1"]);
    });

    it("is idempotent when called twice", () => {
      const { setTypingIndicators, clearTypingIndicators } = useUIStore.getState();

      setTypingIndicators("chat-1", indicators("typing"));
      clearTypingIndicators("chat-1");

      expect(() => clearTypingIndicators("chat-1")).not.toThrow();
      expect(useUIStore.getState().typingIndicators).toEqual({});
    });

    it("allows a chat to be republished after being cleared", () => {
      const { setTypingIndicators, clearTypingIndicators } = useUIStore.getState();

      setTypingIndicators("chat-1", indicators("first"));
      clearTypingIndicators("chat-1");
      setTypingIndicators("chat-1", indicators("second"));

      const map = useUIStore.getState().typingIndicators;
      expect(Object.keys(map ?? {})).toEqual(["chat-1"]);
      expect(map?.["chat-1"].text).toBe("second");
    });

    it("does not disturb toasts or connectivity flags", () => {
      useUIStore.getState().setOnline(false);
      useUIStore.getState().showToast({ type: "info", message: "still here" });
      useUIStore.getState().setTypingIndicators("chat-1", indicators("typing"));

      useUIStore.getState().clearTypingIndicators("chat-1");

      const state = useUIStore.getState();
      expect(state.isOnline).toBe(false);
      expect(state.toasts).toHaveLength(1);
      expect(state.typingIndicators).toEqual({});
    });
  });
});
