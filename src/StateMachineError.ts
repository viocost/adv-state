//import createDerivedErrorClasses from "./DynamicError";

abstract class StateMachineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateMachineError";
  }
}

export class MessageNotExist extends StateMachineError {}
export class DuplicateEventName extends StateMachineError {}
export class InvalidActionType extends StateMachineError {}
export class InvalidTransition extends StateMachineError {}
export class InitialStateError extends StateMachineError {}
export class InErrorState extends StateMachineError {}

///////////////////////////////////////////////////////////////////////////////////
// const err = createDerivedErrorClasses<StateMachineError>(StateMachineError, { //
//   msgNotExist: "MessageNotExist",                                             //
//   noStateMap: "MissingStateMap",                                              //
//   initStateNotInMap: "InitialStateNotFoundInMap",                             //
//   multipleInitialStates: "MultipleInitialStates",                             //
//   stateNotExist: "StateNotExist",                                             //
//   blown: "StateMachineIsBlown",                                               //
//   illegalEventName: "IllegalEventName",                                       //
//   actionTypeInvalid: "ActionTypeInvalid",                                     //
//   cannotDetermineAction: "CannotDetermineValidAction",                        //
// });                                                                           //
///////////////////////////////////////////////////////////////////////////////////
