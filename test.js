const { StateMachine } = require("./src/AdvStateMachine");

function prepareStateMachine() {
  return new StateMachine(
    null,
    {
      name: "test",
      stateMap: {
        start: {
          initial: true,
          transitions: {
            turn: [
              {
                state: "left",

                actions: [
                  (sm, ev, args) => {
                    console.log(t);
                  },
                  () => {
                    console.log("bar");
                  },
                ],
                guards: [() => true, () => true, () => true],
              },
              {
                state: "right",
                guards: [() => false],
              },
            ],
          },
        },

        left: {
          transitions: {
            powerOff: {
              state: "start",
            },
          },
        },

        right: {
          transitions: {
            powerOff: {
              state: "start",
            },
          },
        },
      },
    },
    {
      msgNotExistMode: StateMachine.Warn,
      traceLevel: StateMachine.TraceLevel.DEBUG,
    }
  );
}

function main() {
  let sm = prepareStateMachine();
  sm.handle.turn("Hello", "World");
}

main();
