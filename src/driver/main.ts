import { State } from "../State";

const root = new State("root", {
  initial: true,
  states: {
    1: {
      initial: true,

      states: {
        a: {},
        b: {
          initial: true,
        },
      },
    },
    2: {},

    3: {},
  },
});

root.printUnderlyingMap();
