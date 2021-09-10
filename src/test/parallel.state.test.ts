import StateMachine from "../AdvStateMachine";
import { FakeMBus } from "./TestBus";

describe("Parallel state test", () => {
  const bus = new FakeMBus();
  const sm = prepareTestSM(bus);
  sm.run();
  beforeAll(() => {
    return new Promise((resolve) => {
      sm.handle.foo();
      sm.handle.foo();
      sm.handle.bar();
      bus.on("ENTER_2", resolve);
    });
  });

  it("Should verify valid output", () => {
    console.dir(bus.receivedMessages);
    expect(sm.halted).toBeTruthy();
  });
});

function prepareTestSM(mBus, context = []) {
  return new StateMachine({
    name: "Guard tester",
    contextObject: null,
    messageBus: mBus,

    stateMap: {
      0: {
        initial: true,
        events: {
          foo: {
            toState: 1,
          },
        },
      },

      1: {
        parallel: true,
        events: {
          foo: {
            actions: () => context.push("foo 1"),
          },
          bar: {
            toState: 2,
          },
        },
        states: {
          a1: {
            events: {
              foo: {
                actions: () => context.push("foo a1"),
              },
            },
          },

          b1: {},
        },
      },

      2: {
        final: true,
      },
    },
  });
}
