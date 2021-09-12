import {
  SMVisitor,
  EventDescription,
  IState,
  IStateMachine,
  SMEvent,
} from "./types";

export default abstract class StateMachineVisitor implements SMVisitor {
  enterState(state: IState) {}
  exitState(state: IState) {}
  enterStateMachine(stateMachine: IStateMachine) {}
  exitStateMachine(stateMachine: IStateMachine) {}
  enterEvents(state: IState) {}
  exitEvents(state: IState) {}

  enterSubstates(state: IState) {}
  exitSubstates(state: IState) {}
  enterEventDescription(
    eventName: SMEvent,
    eventDescription: EventDescription
  ) {}
  exitEventDescription(
    eventName: SMEvent,
    eventDescription: EventDescription
  ) {}
}
