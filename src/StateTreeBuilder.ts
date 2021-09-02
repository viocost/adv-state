import { State } from "./State";
import { SMState, StateDescription, StateMap } from "./types";

function buildStateTree(stateMap: StateMap) {
  const root = new State();
  buildStateTreeHelper(root, stateMap);
}

function buildStateTreeHelper(parent: SMState, stateMap: StateMap) {
  for (const stateName in stateMap) {
    const stateDescription = stateMap[stateName];
    const state = new State(stateDescription);
    if (stateDescription.states) {
    }
  }
}
