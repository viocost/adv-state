import { EventStateMatcher } from "../EventStateMatcher";
import { IState } from "../types";

class MockState {
  constructor(name, enabled, events = []) {
    this.name = name;
    this.enabled = enabled;
    for (let event of events) {
      this.events.add(event);
    }
  }
  name: string;
  parallel: boolean = false;
  enabled = false;
  enabledSubstate: MockState = undefined;
  events: Set<any> = new Set();
  substates: {} = {};
  hasEvent(event) {
    return this.events.has(event);
  }
}

describe("A signle state test", () => {
  describe("When a signle state without matching events passed", () => {
    const root = new MockState("root", true) as any;
    it("Should return an empty stack", () => {
      const matcher = new EventStateMatcher(root);
      const stack = matcher.getActiveStateStackForEvent("foo");
      expect(stack.length).toBe(0);
    });
  });

  describe("When a signle state with matching event", () => {
    const root = new MockState("root", true, ["foo"]) as any;
    it("Should return a stack with that state", () => {
      const matcher = new EventStateMatcher(root);
      const stack = matcher.getActiveStateStackForEvent("foo");
      expect(stack.length).toBe(1);
      expect(stack[0]).toBe(root);
    });
  });

  describe("When a signle state with matching event but inactive", () => {
    const root = new MockState("root", false, ["foo"]) as any;
    it("Should return an empty stack", () => {
      const matcher = new EventStateMatcher(root);
      const stack = matcher.getActiveStateStackForEvent("foo");
      expect(stack.length).toBe(0);
    });
  });

  describe("Inconsistent state check", () => {
    const root = new MockState("root", false) as any;

    const l1 = new MockState("l1", false, ["foo"]) as any;

    const l2 = new MockState("l2", true, ["foo"]) as any;

    addChild(root, l1, false);
    addChild(l1, l2, true);

    it("Should return empty stack", () => {
      const matcher = new EventStateMatcher(root);
      const stack = matcher.getActiveStateStackForEvent("foo");
      expect(stack.length).toBe(0);
    });
  });

  describe("When a tree passed", () => {
    const root = new MockState("root", false) as any;

    const l1 = new MockState("l1", true, ["foo"]) as any;
    const l2 = new MockState("l2", true, ["foo"]) as any;

    addChild(root, l1, true);
    addChild(l1, l2, true);

    it("Should return a deeper state first", () => {
      const matcher = new EventStateMatcher(root);
      const stack = matcher.getActiveStateStackForEvent("foo");
      expect(stack.length).toBe(2);
      expect(stack[0]).toBe(l1);
      expect(stack[1]).toBe(l2);
    });
  });

  describe("Complex tree", () => {
    const root = new MockState("root", true) as any;

    const l1 = new MockState("l1", true, ["foo"]) as any;
    l1.parallel = true;

    const a2 = new MockState("a2", true, ["foo"]) as any;
    const b2 = new MockState("b2", true, ["foo"]) as any;
    const c2 = new MockState("c2", true, ["foo"]) as any;
    const d2 = new MockState("d2", true) as any;

    const a3 = new MockState("a3", true, ["foo"]) as any;
    const a4 = new MockState("a4", true, ["foo"]) as any;

    const b3 = new MockState("b3", true, ["foo"]) as any;
    const b4 = new MockState("b4", true, ["foo"]) as any;

    addChild(root, l1, true);
    addChild(l1, a2);
    addChild(l1, b2);
    addChild(l1, c2);
    addChild(l1, d2);

    addChild(a2, a3, true);
    addChild(a3, a4, true);

    addChild(b2, b3, true);
    addChild(b3, b4, true);

    it("Should return a deeper state first", () => {
      const matcher = new EventStateMatcher(root);
      const stack = matcher.getActiveStateStackForEvent("foo");
      expect(stack.length).toBe(8);
      expect(stack[7]).toBe(b4);
      expect(stack[6]).toBe(a4);
      expect(stack[5]).toBe(b3);
      expect(stack[4]).toBe(a3);
      expect(stack[3]).toBe(c2);
      expect(stack[2]).toBe(b2);
      expect(stack[1]).toBe(a2);
      expect(stack[0]).toBe(l1);
    });
  });
});

function addChild(parent, child, enabled = false) {
  parent.substates[child.name] = child;
  if (enabled) {
    parent.enabledSubstate = child;
  }
}
function prepareTest() {}
