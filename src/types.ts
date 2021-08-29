export interface IStateMachine {}

export type SMErrorHandler = (error: Error) => any;

export type SMEvent = string | symbol | number;

export type SMState = string | symbol | number;

export type SMContext = {};

export type SMAction<TData = any, TReturn = any> = (
  event: SMEvent,
  data: TData,
  stateMachine: IStateMachine
) => TReturn;

export type SMGuard<TData = any> = (
  event: SMEvent,
  data: TData,
  stateMachine: IStateMachine
) => boolean;

export type TransitionDescription = {
  state: string | symbol | number;
  actions: SMAction | Array<SMAction>;
  guards: SMGuard | Array<SMGuard>;
};

export type Transitions = {
  [key: string | symbol | number]:
    | TransitionDescription
    | Array<TransitionDescription>;
};

/**
 * Defines a particular identifiable state,
 *
 */
export type StateDescription = {
  /**
   * initial flag defines the state the machine will enter during the initialization
   */
  initial?: true;

  /**
   * Set of entry actions
   */
  entry?: SMAction | Array<SMAction>;

  /**
   * Set of exit actions
   */
  exit?: SMAction | Array<SMAction>;

  /**
   * Set of transitions: see Transitions
   */
  transitions?: Transitions;
};

/**
 * Main state configuration for the state machine. See StateDescription
 */
export type StateMap = {
  [key: string | symbol | number]: StateDescription;
};

export type StateMachineConfig = {
  /**
   * Human readable name for the state machine
   */
  name?: string;

  /**
   * Optional message bus
   * If specified, state machine will subscribe to all the messages,
   * so external agents will be able to trigger state transitions
   *
   */
  messageBus?: SMMessageBus;

  /**
   * See CrashActionDescriptor
   */
  onCrash?: CrashActionDescriptor;

  /**
   * See StateMap
   */
  stateMap: StateMap;
};

/**
 * This is configuration for crash action.
 * Think of it as global try/catch on catch action
 * If error is trhown in one of actions or guard coinditions
 * a specified message will be send over message bus(if it is specified)
 * and a handler will be called with
 */
export type CrashActionDescriptor = {
  message?: SMMessageName;
  handler?: SMErrorHandler;
};

export type SMMessageName = string | number;

export interface SMMessageBus<TMesg = any> {
  subscribe(message?: TMesg): void;
}

export interface IStateMachine {
  handle: Object;
}

export const SMTraceLevel = {
  None: Symbol("none"),
  Info: Symbol("info"),
  Debug: Symbol("debug"),
};
