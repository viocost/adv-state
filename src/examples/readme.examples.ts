import { StateMachine } from "..";

const sm = new StateMachine({
  name: "My first state machine",
  stateMap: {
    state1: {
      initial: true,
      events: {
        go2: {
          toState: "state2",
        },
      },
    },
    state2: {
      final: true,
    },
  },
});

sm.run();
