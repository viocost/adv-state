import {
  IStateMachine,
  StateMachineConfig,
  StateMap,
  SMEvent,
  SMMessageName,
  SMMessageBusMessage,
  LogLevel,
  SMMessageBus,
  LogProcessor,
  Visitable,
  SMVisitor,
  SMErrorAction,
  EventMap,
  Result,
} from "./types";

import { inspect } from "util";
import { State } from "./State";
import { LogFilter } from "./LogFilter";
import { EventMapper } from "./EventMapper";
import { StateTreeValidator } from "./StateTreeValidator";
import { FakeBus } from "./FakeBus";
import { createHandler } from "./StateMachineEventHandler";
import { AmbiguousTransition, GuardError } from "./StateMachineError";
import { StateGetter } from "./StateGetter";

/**
 *
 * Actions
 *   array of lambdas passed to the events
 *   Each will be called with
 *     StateMachine, EventName, EventArgs
 */

export class StateMachine implements IStateMachine, Visitable {
  // Logger
  logger: LogProcessor;

  // State machine human readable name
  name?: string = "State Machine";

  // Will be passed as this to all handlers
  contextObject: Object = null;

  halted: boolean = false;

  result: Result | null = null;

  mBusErrorMessage: string = "STATE_MACHINE_ERROR";

  stateMachineError: string | null = null;

  handle: any = createHandler(this);

  // Maps events to states
  eventMap: EventMap;

  // Message bus
  messageBus: SMMessageBus = new FakeBus();

  // Global log level
  logLevel: LogLevel = LogLevel.WARN;

  // State tree root
  root: State;
  //onCrash?: CrashActionDescriptor;

  onGuardError: SMErrorAction = SMErrorAction.Notify;
  onActionError: SMErrorAction = SMErrorAction.Notify;
  onAmbiguousTransition: SMErrorAction = SMErrorAction.Notify;
  onIllegalEvent: SMErrorAction = SMErrorAction.Notify;

  onDisabledStateEvent: SMErrorAction = SMErrorAction.Ignore;
  onMBusError: SMErrorAction = SMErrorAction.Shutdown;
  onLoggerError: SMErrorAction = SMErrorAction.Shutdown;

  constructor({
    name,
    stateMap,
    messageBus,
    contextObject,
    mBusErrorMessage,
    logLevel = LogLevel.WARN,
  }: StateMachineConfig) {
    this.name = name || this.name;
    this.messageBus = messageBus || this.messageBus;
    this.contextObject = contextObject || this.contextObject;
    this.logLevel = logLevel || this.logLevel;
    this.mBusErrorMessage = mBusErrorMessage || this.mBusErrorMessage;

    this.initLogger(this.logLevel);
    this.logger.debug(`Initialized logger`);
    this.initMessageBus(messageBus);
    this.initStateTree(stateMap);
    this.root = this.initStateTree(stateMap);
    this.validateStateTree(this.root);
    this.eventMap = this.mapEvents();
  }

  initLogger(logLevel: LogLevel) {
    this.logger = new LogFilter(console, logLevel);
  }

  initStateTree(stateMap: StateMap) {
    return new State(this, "root", { states: stateMap }, null);
  }

  initMessageBus(messageBus: SMMessageBus) {
    if (messageBus) {
      this.messageBus = messageBus;
      messageBus.subscribe(this);
    }
  }

  run() {
    this.root.resume();
  }

  accept(visitor: SMVisitor) {
    visitor.enterStateMachine(this);
    this.root.accept(visitor);
    visitor.exitStateMachine(this);
  }

  dispatchMessage(message: SMMessageName, eventArgs: any) {
    if (!this.messageBus || !message) return;

    this.logger.debug(`Sending message: ${message}`);
    this.messageBus.deliver([message, eventArgs], this);
  }

  update(message: SMMessageBusMessage) {
    this.logger.debug("UPDATE called");
    const [messageName, payload] = message;
    this.handle[messageName](payload);
  }

  mapEvents() {
    const eventMapper = new EventMapper();

    this.root.accept(eventMapper);

    this.logger.debug(
      `${this.name} recognizes events ${inspect(
        Array.from(Object.keys(eventMapper.getMap()))
      )}`
    );
    return eventMapper.getMap();
  }

  processEvent(eventName: SMEvent, eventArgs: any) {
    this.logger.debug(`Processing event: ${String(eventName)}`);
    try {
      this.eventMap[eventName]?.processEvent(eventName, eventArgs);
    } catch (error) {
      this.emergencyShutdown(error);
    }
  }

  handleActionError(
    error: Error,
    state: State,
    eventName: SMEvent,
    eventArgs: any
  ) {
    // if ignore return
    if (this.onActionError === SMErrorAction.Ignore) return;

    const errMessage = `Action threw Exception: ${error} in state ${state} on event ${String(
      eventName
    )}`;

    this.logger.error(errMessage);
    this.messageBus.deliver([this.mBusErrorMessage, errMessage], this);

    if (this.onActionError === SMErrorAction.Shutdown) {
      this.emergencyShutdown(errMessage);
    }
  }

  handleAmbiguousTransition(state: State, eventName: SMEvent) {
    if (this.onAmbiguousTransition === SMErrorAction.Ignore) return;

    const errMessage = `Ambiguous transition error in state ${
      state.name
    } on event ${String(eventName)}`;

    this.logger.error(errMessage);
    this.messageBus.deliver([this.mBusErrorMessage, errMessage], this);

    if (this.onAmbiguousTransition === SMErrorAction.Shutdown) {
      throw new AmbiguousTransition(errMessage);
    }
  }

  get state() {
    const stateGetter = new StateGetter();
    this.root.accept(stateGetter);
    return stateGetter.asString();
  }

  handleGuardError(
    error: Error,
    state: State,
    eventName: SMEvent,
    eventArgs: any
  ) {
    // if ignore return
    if (this.onGuardError === SMErrorAction.Ignore) return;

    const errMessage = `Guard condition threw Exception: ${error} in state ${state} on event ${String(
      eventName
    )}`;

    this.logger.error(errMessage);
    this.messageBus.deliver([this.mBusErrorMessage, errMessage], this);

    if (this.onGuardError === SMErrorAction.Shutdown) {
      throw new GuardError(error.message);
    }
  }

  validateStateTree(root: State) {
    const stateTreeValidator = new StateTreeValidator();
    root.accept(stateTreeValidator);
  }

  emergencyShutdown(error: string) {
    this.logger.error(`===!!EMERGENCY SHUTDOWN: ${error}`);
    this.halt(Result.Error);
    this.stateMachineError = error;
  }

  halt(result: Result) {
    this.halted = true;
    this.result = result;

    this.logger.info(`Machine halted`);
  }
}
