import { StateMachine } from "../AdvStateMachine";
import { SMTraceLevel } from "../types";

describe("Basic handle tests", () => {
  const startEntry = jest.fn();
  const action = jest.fn();
  const exitEntry = jest.fn();
  const fakeBus = {
    deliver: jest.fn().mockImplementation((message, obj) => null),
    subscribe: jest.fn().mockImplementation((SM) => null),
  };

  const middleEntry = jest.fn();
  const finishCallback = jest.fn();
  const fakePayload = {
    text: "abc",
  };

  const sm = new StateMachine({
    messageBus: fakeBus,
    traceLevel: SMTraceLevel.Debug,
    stateMap: {
      start: {
        initial: true,

        events: {
          "start-done": {
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

  describe("When handle with existing event called", () => {
    beforeAll(() => {
      return new Promise((resolve, reject) => {
        sm.handle["start-done"](fakePayload);
        setTimeout(resolve, 1000);
      });
    });

    it("Should transition to middle state", () => {
      expect(sm.state).toBe("middle");
      expect(fakeBus.deliver).toHaveBeenCalledWith(["to-middle", fakePayload]);
      expect(middleEntry).toHaveBeenCalledTimes(1);
    });
  });
});
