export interface IStateMachine {}

export type SMErrorHandler = (error: Error) => any;

export type SMEvent = string | number;

export type SMState = string | number;

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

export type EventDescription = {
  toState?: string | number;
  actions?: SMAction | Array<SMAction>;
  guards?: SMGuard | Array<SMGuard>;
  message?: SMMessageName;
};

export type SMEvents = {
  [key: SMEvent]: EventDescription | Array<EventDescription>;
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
   * Set of transitions: see SMEvents
   */
  events?: SMEvents;
};

/**
 * Main state configuration for the state machine. See StateDescription
 */
export type StateMap = {
  [key: SMState]: StateDescription;
};

export type StateMachineConfig = {
  /**
   * See StateMap
   */
  stateMap: StateMap;

  /**
   * Any logger implementations that conforms to the SMLogger interface
   * Default set to console
   */
  logger?: SMLogger;

  /**
   * Human readable name for the state machine
   */
  name?: string;

  /**
   * Optional message bus
   * If specified, state machine will subscribe to all the messages,
   * so external agents will be able to trigger state transitions
   */
  messageBus?: SMMessageBus;

  /**
   * See CrashActionDescriptor
   */
  onCrash?: CrashActionDescriptor;

  /**
   * Specifies verbosity of a state machine
   */
  traceLevel?: SMTraceLevel;

  /**
   * Defines behavior when non-existant in current state message recieved
   */
  msgNotExistMode?: Function;

  contextObject?: Object | null;
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
export type SMMessageBusMessage = [message: SMMessageName, payload?: any];

export interface SMMessageBus<TMesg = any> {
  subscribe(message?: TMesg): void;
  deliver(
    message: SMMessageBusMessage,
    contextObject: Object,
    channel?: any
  ): void;
}

export interface IStateMachine {
  handle: Object;
}

export enum SMTraceLevel {
  None,
  Info,
  Debug,
}

export enum SMMessageNotExistMode {
  Discard,
  Info,
  Die,
}

export interface SMLogger {
  log: (message: string, ...rest: any) => void;
  warn: (message: string, ...rest: any) => void;
  error: (message: string, ...rest: any) => void;
}
