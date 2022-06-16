import { IState, SMEvent } from "./types";

/**
 * This class implements event->states matching algorithm.
 * The purpose of it is to find all the states that can handle given event.
 * The event should be handled first by deeper states, as such processing guaranties that
 * all transitions will remain within the parent.
 *
 * This is a breadth-first search that walks all the active states and pushes them to the
 * stack, which is eventually returned to the caller.
 *
 * In the event of parallel state with children,
 * this algorithm will push nodes in order from deep to shallow.
 *
 * */
export class EventStateMatcher {
  constructor(private root: IState) {}

  getActiveStateStackForEvent(event: SMEvent) {
    const stack: IState[] = [];
    const visited = new Set<IState>();
    let queue: IState[] = [this.root];
    visited.add(this.root);

    while (queue.length > 0) {
      const [node] = queue.splice(0, 1);

      if (node.enabled && node.hasEvent(event)) {
        stack.push(node);
      }

      if (node.parallel) {
        for (let stateId in node.substates) {
          const childNode = node.substates[stateId];
          if (!visited.has(childNode)) {
            queue.push(childNode);
            visited.add(childNode);
          }
        }
      } else if (node.enabledSubstate && !visited.has(node.enabledSubstate)) {
        queue.push(node.enabledSubstate);
        visited.add(node.enabledSubstate);
      }
    }

    return stack;
  }

  helper(state: IState, stack: []) {}
}
