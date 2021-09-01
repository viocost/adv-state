import { StateMachine } from "../AdvStateMachine";
import { SMMessageBusMessage } from "../types";
import { EventEmitter } from "events";

class FakeMBus extends EventEmitter {
  receivedMessages = [];
  sm: StateMachine;
  subscribe(sm: StateMachine) {
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

describe("When transition action throws error", () => {
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

  it("It should send a message over message bus", () => {
    console.log("Messages received");
    expect(bus.receivedMessages[0]).toBe("global-error");
  });
});

describe("When entry action throws error", () => {
  const bus = new FakeMBus();
  const sm = prepareTestSM(bus);

  beforeAll(() => {
    return new Promise((resolve, reject) => {
      bus.on("to-state-2", () => sm.handle.doneTwo({ bar: "bazz" }));

      bus.on("global-error", resolve);
      sm.run();
      sm.handle.goThree();
    });
  });

  it("It should send a message over message bus", () => {
    console.log("Messages received");
    expect(bus.receivedMessages[0]).toBe("global-error");
  });
});

describe("When exit action throws error", () => {
  const bus = new FakeMBus();
  const sm = prepareTestSM(bus);

  beforeAll(() => {
    return new Promise((resolve, reject) => {
      bus.on("to-state-2", () => sm.handle.doneTwo({ bar: "bazz" }));

      bus.on("in-four", () => sm.handle.finish());

      bus.on("global-error", resolve);
      sm.run();
      sm.handle.goFour();
    });
  });

  it("It should send a message over message bus", () => {
    console.log("Messages received");
    expect(bus.receivedMessages[1]).toBe("global-error");
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
            },
          ],

          goThree: {
            toState: 3,
          },

          goFour: {
            toState: 4,
          },
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

      3: {
        entry: () => {
          throw new Error();
        },
      },

      4: {
        entryMessage: "in-four",
        events: {
          finish: {
            toState: "finish",
          },
        },
        exit: () => {
          throw new Error();
        },
      },

      finish: {
        entry: () => console.log("Done"),
        entryMessage: "at-finish",
      },
    },
  });
}
