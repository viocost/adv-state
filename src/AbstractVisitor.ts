import { SMVisitor, EventDescription, IState, IStateMachine } from "./types";

export default abstract class StateMachineVisitor implements SMVisitor {
  enterState(state: IState) {}
  exitState(state: IState) {}
  enterStateMachine(stateMachine: IStateMachine) {}
  exitStateMachine(stateMachine: IStateMachine) {}
  enterEventDescription(eventDescription: EventDescription) {}
  exitEventDescription(eventDescription: EventDescription) {}
}
