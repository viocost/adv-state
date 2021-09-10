import StateMachine from "../AdvStateMachine";

describe("Basic handle tests", () => {
  const fakeBus = {
    deliver: jest.fn().mockImplementation((message, obj) => {
      const [messageName, payload] = message;
      console.log(`Deliver called with ${messageName}`);
    }),
    subscribe: jest.fn().mockImplementation((SM) => null),
  };

  const middleEntry = jest.fn();
  const finishCallback = jest.fn();
  const fakePayload = {
    text: "abc",
  };

  const sm = new StateMachine({
    messageBus: fakeBus,

    stateMap: {
      start: {
        initial: true,

        events: {
          startDone: {
            toState: "middle",
            message: "to-middle",
          },
        },
      },
      middle: {
        entry: middleEntry,
        events: {
          "middle-done": {
            toState: "finish",
            message: "finish",
          },
        },
      },

      finish: {
        entry: finishCallback,
      },
    },
  });
  sm.run();

  describe("When handle with existing event called", () => {
    beforeAll(() => {
      return new Promise((resolve, reject) => {
        sm.handle.startDone(fakePayload);
        setTimeout(resolve, 100);
      });
    });

    it("Should transition to middle state", () => {
      expect(fakeBus.deliver).toHaveBeenCalledTimes(5);
      expect(middleEntry).toHaveBeenCalledTimes(1);
    });
  });
});

describe("Support for same named events in multiple states", () => {
  const initCallback = jest.fn();
  const midCallback = jest.fn();
  const sm = new StateMachine({
    name: "Same name events machine",
    stateMap: {
      start: {
        initial: true,
        events: {
          foo: {
            toState: "middle",
            actions: initCallback,
          },
        },
      },

      middle: {
        events: {
          foo: {
            actions: midCallback,
          },
        },
      },
    },
  });

  beforeAll(() => {
    return new Promise((resolve) => {
      sm.run();
      sm.handle.foo();
      sm.handle.foo();
      setTimeout(resolve, 50);
    });
  });

  it("Should ensure valid state transition and action calls", () => {
    expect(sm).toBeDefined();
    expect(initCallback).toHaveBeenCalledTimes(1);
    expect(midCallback).toHaveBeenCalledTimes(1);
  });
});
