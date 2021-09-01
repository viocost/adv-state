import { StateMachine } from "../AdvStateMachine";
import { SMMessageBusMessage } from "../types";
import { EventEmitter } from "events";

describe("Advanced test with guard conditions", () => {
  const sm = prepareTestSM();
  beforeAll(() => {
    sm.handle.nonExistant();
  });

  it("Should verify the output", () => {
    expect(sm.error).toBeFalsy();
  });
});

function prepareTestSM() {
  return new StateMachine({
    name: "Guard tester",
    contextObject: null,
    onCrash: {
      message: "global-error",
    },

    stateMap: {
      0: {
        initial: true,
      },
    },
  });
}
