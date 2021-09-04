import {
  IStateMachine,
  StateMachineConfig,
  StateMap,
  SMEvent,
  SMAction,
  SMMessageName,
  SMMessageBusMessage,
  LogLevel,
  SMMessageBus,
  LogProcessor,
  Visitable,
  SMVisitor,
  SMErrorAction,
} from "./types";

import { inspect } from "util";
import { State } from "./State";
import { LoggerContainer } from "./LoggerContainer";
import { LogFilter } from "./LogFilter";
import { EventMapper } from "./EventMapper";
import { StateTreeValidator } from "./StateTreeValidator";
import { FakeBus } from "./FakeBus";
import { createHandler } from "./StateMachineEventHandler";

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

  // global error
  error: boolean = false;

  handle: any = createHandler(this);

  // Maps events to states
  eventMap: Map<SMEvent, State>;

  // Message bus
  messageBus: SMMessageBus = new FakeBus();

  // Global log level
  logLevel: LogLevel = LogLevel.WARN;

  // State tree root
  root: State;
  //onCrash?: CrashActionDescriptor;

  onGuardError: SMErrorAction = SMErrorAction.Notify;
  onActionError: SMErrorAction = SMErrorAction.Notify;
  onInconsistentTransition: SMErrorAction = SMErrorAction.Shutdown;
  onIllegalEvent: SMErrorAction = SMErrorAction.Ignore;

  onDisabledStateEvent: SMErrorAction = SMErrorAction.Ignore;
  onMBusError: SMErrorAction = SMErrorAction.Shutdown;
  onLoggerError: SMErrorAction = SMErrorAction.Shutdown;

  constructor({
    name,
    stateMap,
    messageBus,
    contextObject,
    logLevel = LogLevel.WARN,
  }: StateMachineConfig) {
    this.error = false;
    this.name = name || this.name;
    this.messageBus = messageBus || this.messageBus;
    this.contextObject = contextObject || this.contextObject;
    this.logLevel = logLevel || this.logLevel;

    this.initLogger(this.logLevel);
    this.initMessageBus(messageBus);
    this.initStateTree(stateMap);
    this.root = this.initStateTree(stateMap);
    this.validateStateTree(this.root);
    this.eventMap = this.mapEvents();
  }

  initLogger(logLevel: LogLevel) {
    this.logger = new LoggerContainer(new LogFilter(console, logLevel));
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
        Array.from(eventMapper.getMap().keys())
      )}`
    );
    return eventMapper.getMap();
  }

  processEvent(eventName: SMEvent, eventArgs: any) {
    this.eventMap[eventName]?.processEvent(eventName, eventArgs);
  }

  handleEventError(error: Error) {}

  validateStateTree(root: State) {
    const stateTreeValidator = new StateTreeValidator();
    root.accept(stateTreeValidator);
  }

  emergencyShutdown(error: string) {
    //capture current state
    // transition to error
    //
  }
}
