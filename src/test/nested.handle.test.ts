import { StateMachine } from "../AdvStateMachine";
import { SMMessageBusMessage, SMTraceLevel } from "../types";
import { EventEmitter } from "events";

class FakeMBus extends EventEmitter {
  receivedMessages = [];
  sm: StateMachine;
  subscribe(sm: StateMachine) {
    console.log("Subscribe called");
    this.sm = sm;
  }

  deliver(msg: SMMessageBusMessage, ...rest: any) {
    const [mName, payload] = msg;
    this.emit(mName as string, payload);
    this.receivedMessages.push(mName);
  }
}

describe("Advanced test with guard conditions", () => {
  const bus = new FakeMBus();
  const sm = prepareTestSM(bus);
  beforeAll(() => {
    return new Promise((resolve, reject) => {
      sm.run();
      sm.handle.toOne(sm);
      bus.on("enter-2", resolve);
    });
  });

  it("Should verify the output", () => {
    expect(sm.error).toBeFalsy();
    expect(bus.receivedMessages[0]).toBe("exit-0");
    expect(bus.receivedMessages[1]).toBe("enter-1");
    expect(bus.receivedMessages[2]).toBe("exit-1");
    expect(bus.receivedMessages[3]).toBe("enter-2");
  });
});

function prepareTestSM(bus) {
  return new StateMachine({
    name: "Nested handler tester",
    contextObject: null,
    messageBus: bus,
    traceLevel: SMTraceLevel.Debug,

    onCrash: {
      message: "global-error",
    },

    stateMap: {
      0: {
        entryMessage: "enter-0",
        initial: true,
        events: {
          toOne: {
            toState: 1,
          },
        },
        exit: () => {
          console.log("Exit zero");
        },

        exitMessage: "exit-0",
      },
      1: {
        entryMessage: "enter-1",
        entry: (sm: StateMachine) => {
          sm.handle.toTwo();
        },
        events: {
          toTwo: {
            toState: 2,
          },
        },

        exit: () => {
          console.log("Exit one");
        },

        exitMessage: "exit-1",
      },
      2: {
        entryMessage: "enter-2",
        exitMessage: "exit-2",
      },
    },
  });
}
