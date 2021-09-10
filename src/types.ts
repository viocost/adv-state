export interface IStateMachine {
  enterStateMessagePrefix?: string;
  exitStateMessagePrefix?: string;
  actionMessagePrefix?: string;
  name?: string;
  logger: LogProcessor;
  run(): void;
  accept(visitor: SMVisitor): void;
  update(message: SMMessageBusMessage): void;

  dispatchMessage(message: SMMessageName, eventArgs: any): void;
  processEvent(eventName: SMEvent, eventArgs: any): void;
  handleActionError(
    error: Error,
    state: IState,
    eventName: SMEvent,
    eventArgs: any
  ): void;
  handleGuardError(
    error: Error,
    state: IState,
    eventName: SMEvent,
    eventArgs: any
  ): void;
  handleAmbiguousTransition(state: IState, eventName: SMEvent): void;
  get state(): string;
}

export interface IState {
  enabled: boolean;
  enabledSubstate?: IState;
  hasEvent(event: SMEvent): boolean;

  substates: Substates;
  logger: any;
  parallel: boolean;
  initial: boolean;
  isLeafState: boolean;

  // Reference for initial substate
  initialSubstate?: IState;

  // Reference for history substate
  historySubstate?: IState;
  name: SMStateName;
  parent?: IState;
  config: StateDescription;
  withdraw(eventName: SMEvent, eventArgs?: any): void;
  resume(eventName: SMEvent, eventArgs?: any): void;
  performTransition(
    newStateName: SMStateName,
    eventName: SMEvent,
    eventArgs?: any
  ): void;
  accept(visitor: SMVisitor): void;
  processEvent(event: SMEvent, payload: any): void;
}

export type SMErrorHandler = (error: Error) => any;

export type SMEvent = string | number | symbol;

export type SMStateName = string | number;

export type SMContext = {};

export type SMAction<TData = any, TReturn = any> = (
  stateMachine: IStateMachine,
  event: SMEvent,
  data: TData
) => TReturn;

export type SMGuard<TData = any> = (
  stateMachine: IStateMachine,
  event: SMEvent,
  data: TData
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

  /**
   * set of substates
   * */
  states?: StateMap;
};

/**
 * Main state configuration for the state machine. See StateDescription
 */
export type StateMap = {
  [key: SMStateName]: StateDescription;
};

export type Substates = {
  [key: SMStateName]: IState;
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

  onGuardError?: SMErrorAction;
  onIllegalEvent?: SMErrorAction;
  onAmbiguousTransition?: SMErrorAction;
  onActionError?: SMErrorAction;
  /**
   * Specifies verbosity of a state machine
   */
  logLevel?: LogLevel;

  mBusErrorMessage?: string;

  enterStateMessagePrefix?: string;
  exitStateMessagePrefix?: string;
  actionMessagePrefix?: string;

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

export enum LogLevel {
  SILENT = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

export interface LogProcessor {
  debug: (message: string, ...rest: any) => void;
  info: (message: string, ...rest: any) => void;
  warn: (message: string, ...rest: any) => void;
  error: (message: string, ...rest: any) => void;
}

export interface SMVisitor {
  enterStateMachine: (stateMachine: IStateMachine) => void;
  exitStateMachine: (stateMachine: IStateMachine) => void;
  enterState: (state: IState) => void;
  exitState: (state: IState) => void;
  enterEventDescription: (eventDescription: EventDescription) => void;
  exitEventDescription: (eventDescription: EventDescription) => void;
}

export interface Visitable {
  accept: (visitor: SMVisitor) => void;
}

export enum SMErrorAction {
  Ignore = "IGNORE",
  Notify = "NOTIFY",
  Shutdown = "SHUTDOWN",
}

export enum Result {
  Finished,
  Error,
}
