abstract class StateMachineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateMachineError";
  }
}

export class MessageNotExist extends StateMachineError {}
export class InvalidActionType extends StateMachineError {}
export class InvalidTransition extends StateMachineError {}
export class InitialStateError extends StateMachineError {}
export class InHaltedState extends StateMachineError {}
export class GuardError extends StateMachineError {}
export class ActionError extends StateMachineError {}
export class AmbiguousTransition extends StateMachineError {}
