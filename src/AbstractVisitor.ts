import { StateMachine } from "./AdvStateMachine";
import { State } from "./State";
import { SMVisitor, EventDescription } from "./types";

export abstract class StateMachineVisitor implements SMVisitor {
  enterState(state: State) {}
  exitState(state: State) {}
  enterStateMachine(stateMachine: StateMachine) {}
  exitStateMachine(stateMachine: StateMachine) {}
  enterEventDescription(eventDescription: EventDescription) {}
  exitEventDescription(eventDescription: EventDescription) {}
}
