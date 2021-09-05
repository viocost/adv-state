import { LogLevel, SMErrorAction, SMMessageBusMessage } from "../types";
import { StateMachine } from "../AdvStateMachine";

describe("Guard exception handler", () => {
  const sm = prepareGuardFaltySM(SMErrorAction.Ignore);
  beforeAll(() => {
    return new Promise((resolve) => {
      sm.run();
      sm.handle.toOne();
      setTimeout(resolve, 100);
    });
  });

  it("Should be in initial state and not throw error", () => {
    expect(sm.state).toBe("root.initial");
    expect(sm.halted).toBeFalsy();
  });
});

function prepareGuardFaltySM(onGuardError: SMErrorAction) {
  return new StateMachine({
    logLevel: LogLevel.DEBUG,
    name: "Guard faulty SM",
    onGuardError: onGuardError,

    stateMap: {
      initial: {
        initial: true,
        events: {
          toOne: [
            {
              toState: 1,
              guards: () => {
                throw new Error();
              },
            },
          ],
        },
      },
      1: {
        entry: () => console.log("In one!"),
      },
    },
  });
}
