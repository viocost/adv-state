import { StateMachine } from "../AdvStateMachine";
import { SMMessageBusMessage } from "../types";
import { EventEmitter } from "events";

class FakeMBus extends EventEmitter {
  receivedMessages = [];
  sm: StateMachine;
  subscribe(sm: StateMachine) {
    console.log("Subscribe called");
    this.sm = sm;
  }

  deliver(msg: SMMessageBusMessage, ...rest: any) {
    console.log("DELIVER CALLED");
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
      bus.on("to-state-2", () => sm.handle.doneTwo({ bar: "bazz" }));

      bus.on("global-error", resolve);
      sm.run();
      sm.handle.doneZero({ foo: "bar" });
    });
  });

  it("Should verify the output", () => {
    console.log("Messages received");
    expect(bus.receivedMessages[0]).toBe("global-error");
  });
});

function prepareTestSM(mBus) {
  return new StateMachine({
    name: "Guard tester",
    contextObject: null,
    messageBus: mBus,
    onCrash: {
      message: "global-error",
    },

    stateMap: {
      0: {
        initial: true,
        events: {
          doneZero: [
            {
              toState: 2,
              message: "to-state-2",
              actions: () => {
                throw new Error();
              },
              guards: [() => true],
            },
          ],
        },
      },

      2: {
        entryMessage: "at-state-2",
        events: {
          doneTwo: [
            {
              toState: "finish",
              guards: [() => true],
            },
          ],
        },

        exitMessage: "leaving-state-2",
      },

      finish: {
        entry: () => console.log("Done"),
        entryMessage: "at-finish",
      },
    },
  });
}
