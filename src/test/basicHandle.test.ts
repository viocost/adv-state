import { StateMachine } from "../AdvStateMachine";

describe("Basic handle tests", () => {
  const startEntry = jest.fn();
  const action = jest.fn();
  const exitEntry = jest.fn();
  const fakeBus = {
    deliver: jest.fn().mockImplementation((message, obj) => {
      const [messageName, payload] = message;
      console.log(`Deliver called with ${messageName}`);
      console.dir(payload);
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
      expect(fakeBus.deliver).toHaveBeenCalledTimes(1);
      expect(middleEntry).toHaveBeenCalledTimes(1);
    });
  });
});
