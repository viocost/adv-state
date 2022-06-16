import StateMachine from "../AdvStateMachine";
import { XStateVizTranslator } from "../XStateVizTranslator";

const sm = new StateMachine({
  stateMap: {
    start: {
      initial: true,
    },
    middle: {},
    end: {
      final: true,
    },
  },
});

const printer = new XStateVizTranslator();

sm.accept(printer);
