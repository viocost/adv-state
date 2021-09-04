import { StateMachine } from "./AdvStateMachine";
import { State } from "./State";

export interface IStateMachine {}

export type SMErrorHandler = (error: Error) => any;

export type SMEvent = string | number;

export type SMStateName = string | number;

export interface SMState {
  name: SMStateName;

  withdraw(eventName: SMEvent, eventArgs?: any): void;
  resume(eventName: SMEvent, eventArgs?: any): void;
  performTransition(
    newStateName: SMStateName,
    eventName: SMEvent,
    eventArgs?: any
  ): void;

  processEvent(event: SMEvent, payload: any): void;
}

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
   * A message to push over message bus when entering the state
   * */
  entryMessage?: SMMessageName;

  /**
   * Set of exit actions
   */
  exit?: SMAction | Array<SMAction>;

  /**
   * A message to push over message bus when exiting the state
   * */
  exitMessage?: SMMessageName;

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
  logLevel?: LogLevel;

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
  enterStateMachine: (stateMachine: StateMachine) => void;
  exitStateMachine: (stateMachine: StateMachine) => void;
  enterState: (state: State) => void;
  exitState: (state: State) => void;
}

export interface Visitable {
  accept: (visitor: SMVisitor) => void;
}
