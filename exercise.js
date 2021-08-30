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
                guards: [() => true, () => true, () => true],
                message: "process_left",
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
