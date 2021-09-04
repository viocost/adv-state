import { StateMachine } from "../AdvStateMachine";
import { StateMachinePrettyPrinter } from "../StateMachinePrettyPrinter";

const sm = new StateMachine({
  name: "Test state machine",
  stateMap: {
    start: {
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
      entry: () => console.log("in 3"),
    },
  },
});

sm.run();

const prettyPrinter = new StateMachinePrettyPrinter();
sm.accept(prettyPrinter);

sm.handle.go3();
