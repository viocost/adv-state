import { LogLevel, Result, SMErrorAction, SMMessageBusMessage } from "../types";
import { StateMachine } from "../AdvStateMachine";
import { FakeMBus } from "./TestBus";
import { GuardError } from "../StateMachineError";

describe("When Ignore strategy is choosen for guard errors", () => {
  const mBus = new FakeMBus();
  const sm = prepareGuardFaltySM(SMErrorAction.Ignore, mBus);
  beforeAll(() => {
    return new Promise((resolve) => {
      sm.run();
      sm.handle.toOne();
      setTimeout(resolve, 100);
    });
  });

  it("Should end up in initial state and not throw error", () => {
    expect(sm.state).toBe("root.initial");
    expect(mBus.receivedMessages.length).toBe(0);
    expect(sm.halted).toBeFalsy();
  });
});

describe("When notify strategy is choosen for guard errors", () => {
  const mBus = new FakeMBus();
  const sm = prepareGuardFaltySM(SMErrorAction.Notify, mBus);
  beforeAll(() => {
    return new Promise((resolve) => {
      sm.run();
      sm.handle.toOne();
      setTimeout(resolve, 100);
    });
  });

  it("Should end up in initial state, not throw error, and deliver message over MBus", () => {
    expect(sm.state).toBe("root.initial");

    expect(mBus.receivedMessages[0]).toBe("ERROR");
    expect(mBus.receivedPayloads[0]).toBeDefined();
    expect(sm.halted).toBeFalsy();
  });
});

describe("When shutdown strategy is choosen for guard errors", () => {
  const mBus = new FakeMBus();
  const sm = prepareGuardFaltySM(SMErrorAction.Shutdown, mBus);

  beforeAll(() => {
    return new Promise((resolve) => {
      sm.run();
      sm.handle.toOne();
      setTimeout(resolve, 100);
    });
  });
  it("Should be in initial state. Machine should be halted with result Error. Error message should be defined", () => {
    expect(sm.state).toBe("root.initial");
    expect(mBus.receivedMessages[0]).toBe("ERROR");
    expect(mBus.receivedPayloads[0]).toBeDefined();
    expect(sm.halted).toBeTruthy();
    expect(sm.stateMachineError).toBeDefined();
    expect(sm.result).toBe(Result.Error);
  });
});

function prepareGuardFaltySM(onGuardError: SMErrorAction, mBus) {
  return new StateMachine({
    logLevel: LogLevel.DEBUG,
    name: "Guard faulty SM",
    onGuardError: onGuardError,
    messageBus: mBus,
    mBusErrorMessage: "ERROR",

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
