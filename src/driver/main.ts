import { StateMachine } from "../AdvStateMachine";
import { StateMachinePrettyPrinter } from "../StateMachinePrettyPrinter";
import { LogLevel } from "../types";

const sm = new StateMachine({
  name: "Test state machine",
  logLevel: LogLevel.DEBUG,
  stateMap: {
    start: {
      states: {
        sub1: {
          initial: true,
          entry: () => console.log("Sub1"),
        },
      },
      initial: true,
      entry: () => console.log("I am just starting"),
      events: {
        go2: {
          toState: "2",
        },

        go3: {
          toState: "3",
        },
      },
    },

    2: {
      entry: () => console.log("in 2"),
    },

    3: {
      states: {
        sub3: {
          initial: true,
          entry: () => console.log("Sub3"),
        },
      },
      entry: () => console.log("in 3"),
    },
  },
});

sm.run();

const prettyPrinter = new StateMachinePrettyPrinter();

//sm.accept(prettyPrinter);

sm.handle.go3();

setTimeout(process.exit, 1000);
