import {
  SMState,
  IStateMachine,
  StateMachineConfig,
  SMLogger,
  StateMap,
  SMEvent,
  SMAction,
  SMMessageName,
  SMMessageBusMessage,
  SMTraceLevel,
  SMMessageBus,
  EventDescription,
  SMEvents,
} from "./types";
import createDerivedErrorClasses from "./DynamicError";
import { inspect } from "util";

export const STATE_MACHINE_DEFAULT_NAME = "State machine";

class StateMachineError extends Error {
  constructor(details) {
    super(details);
    this.name = "StateMachineError";
  }
}

const ActionType = {
  Entry: "Entry",
  Exit: "Exit",
  Transition: "Transition",
};

const err = createDerivedErrorClasses<StateMachineError>(StateMachineError, {
  msgNotExist: "MessageNotExist",
  noStateMap: "MissingStateMap",
  initStateNotInMap: "InitialStateNotFoundInMap",
  multipleInitialStates: "MultipleInitialStates",
  stateNotExist: "StateNotExist",
  blown: "StateMachineIsBlown",
  illegalEventName: "IllegalEventName",
  actionTypeInvalid: "ActionTypeInvalid",
  cannotDetermineAction: "CannotDetermineValidAction",
});

/**
 *
 * Actions
 *   array of lambdas passed to the events
 *   Each will be called with
 *     StateMachine, EventName, EventArgs
 */

export class StateMachine implements IStateMachine {
  static Discard() {}
  static Warn(smName, prop) {
    console.warn(`${smName}: property ${prop} does not exist in current state`);
  }
  static Die(prop, smName) {
    throw new err.msgNotExist(`${smName}, ${prop}`);
  }

  logger: SMLogger;
  private traceLevel = SMTraceLevel.None;
  name: string = STATE_MACHINE_DEFAULT_NAME;
  contextObject: Object;
  error: any;
  legalEvents: any;
  stateMap: StateMap;
  msgNotExistMode: Function;
  state: SMState;
  messageBus: SMMessageBus;

  handle = new Proxy(this, {
    get(target: StateMachine, prop: string): Function {
      target.logger.log(`Received event ${prop}`);
      if (target.error) throw new err.blown(target.error);
      if (target.legalEvents.has(prop))
        return (payload?: any) => {
          setImmediate(() => {
            if (target.error) return;
            try {
              target.processEvent(prop, payload);
            } catch (err) {
              target.error = err;
              target.logger.warn(
                `${target.name}: Event handler "${String(
                  prop
                )}" thrown an exception: ${err}`
              );
              if (target.isDebug()) throw err;
            }
          });
        };

      target.logger.log(`Illegal event received: ${String(prop)}`);
    },
  }) as any;

  constructor({
    name,
    stateMap,
    messageBus = null,
    logger = console,
    contextObject = null,
    msgNotExistMode = StateMachine.Discard,
    traceLevel = SMTraceLevel.Info,
  }: StateMachineConfig) {
    this.logger = logger;

    this.validateStateMap(stateMap);
    this.contextObject = contextObject;

    if (messageBus) {
      this.messageBus = messageBus;
      messageBus.subscribe(this);
    }

    this.error = false;
    this.traceLevel = traceLevel;
    this.name = name ? name : STATE_MACHINE_DEFAULT_NAME;
    this.msgNotExistMode = msgNotExistMode;
    this.stateMap = new Proxy(stateMap, {
      get(target, prop: string) {
        if (!(prop in target)) throw new err.stateNotExist(prop);
        return target[prop];
      },
    });

    this.legalEvents = this.generateEventNames();
  }

  run() {
    const initialState = this.getInitialState(this.stateMap);
    this.setNewState(initialState);
    this.performActions(
      actionsAsArray(this.stateMap[initialState].entry),
      "Initial entry",
      undefined
    );
  }

  update(message: SMMessageBusMessage) {
    this.logger.log("UPDATE called");
    const [messageName, payload] = message;
    this.handle[messageName](payload);
  }

  getEventDescription(eventName: SMEvent, eventArgs?: any) {
    if (!(eventName in this.stateMap[this.state].events)) {
      this.msgNotExistMode(eventName, this.name);
      return;
    }

    let descriptions = asArray(
      this.stateMap[this.state].events[eventName]
    ).filter((description) =>
      this.areGuardsPassed(description, eventName, eventArgs)
    );

    if (descriptions.length > 1) {
      this.error = true;
      throw new err.cannotDetermineAction(
        `For ${String(eventName)}. Multiple actions' guards passed`
      );
    }

    this.logEventDescription(eventName, descriptions[0]);

    return descriptions[0];
  }

  logEventDescription(eventName: SMEvent, eventDescription?: EventDescription) {
    if (undefined === eventDescription && this.isInfo()) {
      this.logger.log(`  NO VALID ACTION FOUND for ${String(eventName)}`);
    }
  }

  areGuardsPassed(
    evDescription: EventDescription,
    eventName: SMEvent,
    eventArgs: any
  ) {
    return actionsAsArray(evDescription.guards).reduce(
      (res, guard) =>
        guard.call(this.contextObject, this, eventName, eventArgs) && res,
      true
    );
  }

  /**
   * This function is called whenever stateMachine.handle.someTransition() called
   * If the event doesn't require a state transition, then only guards and actions are
   * executed, otherwise, state exit actions and new state entry actions will be executed
   */
  processEvent(eventName: SMEvent, eventArgs?: any) {
    this.logProcessEventStart(eventName, eventArgs);

    let eventDescription = this.getEventDescription(eventName, eventArgs);
    this.executeEvent(eventDescription, eventName, eventArgs);
  }

  private executeEvent(
    eventDescription: EventDescription,
    eventName: SMEvent,
    eventArgs?: any
  ) {
    const { actions, toState: newState } = eventDescription;

    this.performExitActionsOnTransition(eventName, newState, eventArgs);

    this.performOnTransitionActions(
      actionsAsArray(actions),
      eventName,
      eventArgs
    );
    this.sendMessageOnEvent(eventDescription.message, eventArgs);

    this.setNewState(newState);
    this.performEntryActions(eventName, newState, eventArgs);
  }

  private performOnTransitionActions(
    actions: Array<SMAction>,
    eventName: SMEvent,
    eventArgs: any
  ) {
    if (actions.length === 0) return;

    this.logPerformingActions(ActionType.Transition, this.state, eventName);
    this.performActions(actionsAsArray(actions), eventName, eventArgs);
  }

  private performEntryActions(
    eventName: SMEvent,
    newState: SMState,
    eventArgs: any
  ) {
    const entryActions = actionsAsArray(this.stateMap[newState].entry);
    if (entryActions.length === 0) return;

    this.logPerformingActions(ActionType.Entry, this.state, eventName);
    this.performActions(entryActions, eventName, eventArgs);
  }

  private setNewState(newState: SMState) {
    this.state = newState;
    this.logStateTransition(newState);
  }

  private logStateTransition(newState) {
    if (this.isInfo())
      this.logger.log(
        `%c ${this.name}: State is now set to ${String(this.state)}`,
        "color: #3502ff; font-size: 10px; font-weight: 600; "
      );
  }

  private performExitActionsOnTransition(
    eventName: SMEvent,
    newState?: SMState,
    eventArgs?: any
  ) {
    const exitActions = actionsAsArray(this.stateMap[this.state].exit);

    if (!newState || exitActions.length === 0) {
      return;
    }

    this.logPerformingActions(ActionType.Exit, this.state, eventName);

    this.ensureLegalState(newState as SMState);

    this.performActions(exitActions, eventName, eventArgs);
  }

  ensureLegalState(state: SMState) {
    if (!(state in this.stateMap)) {
      this.error = true;
      throw new err.stateNotExist(state);
    }
  }

  logProcessEventStart(eventName: SMEvent, eventArgs?: any) {
    if (this.isInfo()) {
      this.logger.log(`${this.name}: Current state: ${String(this.state)}. `);
      if (this.isDebug())
        this.logger.log(
          `   Processing event ${eventName}(${inspect(eventArgs)})`
        );
    }
  }

  sendMessageOnEvent(message: SMMessageName, eventArgs: any) {
    this.logger.log(`Sending message: ${message}`);
    console.dir(eventArgs);
    if (!this.messageBus || !message) return;
    this.messageBus.deliver([message, eventArgs], this);
  }

  performActions(
    actions: Array<SMAction>,
    eventName: SMEvent,
    eventArgs?: any
  ) {
    for (let action of actions) {
      if (typeof action !== "function") {
        this.error = true;
        throw new err.actionTypeInvalid(typeof action);
      }
      action.call(this.contextObject, this, eventName, eventArgs);
    }
  }

  private logPerformingActions(
    context: string,
    state: SMState,
    eventName: SMEvent
  ) {
    if (this.isDebug()) {
      this.logger.log(
        `%c ${this.name}: Calling ${context} actions for state ${state}  || Event name: ${eventName} `,
        "color: #c45f01; font-size: 13px; font-weight: 600; "
      );
    }
  }

  generateEventNames() {
    let res = new Set();

    for (let state in this.stateMap) {
      for (let event in this.stateMap[state].events) {
        res.add(event);
      }
    }
    if (this.isInfo())
      this.logger.log(
        `${this.name} recognizes events ${inspect(Array.from(res))}`
      );
    return res;
  }

  isDebug() {
    return this.traceLevel === SMTraceLevel.Debug;
  }

  isInfo() {
    return (
      this.traceLevel === SMTraceLevel.Debug ||
      this.traceLevel === SMTraceLevel.Info
    );
  }

  validateStateMap(stateMap) {
    /*
        * State map constraints
        *
        * 1. Any state can be either leaf state or region
        * 2. Region state must have property region: true
        * 3. There must be exactly ONE region or state that is root.
        * 4. Any region can be either concurrent or non-concurrent
        * 5. Non-concurrent region has exactly one active child state when active
        * 6. Concurrent region assumes to have one or more child regions
        * 7. In concurrent region when active all its children regions are active
        * 8. Concurrent region cannot have leaf states as children
        * 9. Non-concurrent region can have memory enabled, so when re-entered, the state will be set to where it left off.
        * 10. By default a region considered to be non-concurrent. To make region concurrent need to set concurrent: true in state map.
                //Verify there is state map
        */
    if (stateMap === undefined) throw new err.noStateMap();

    //Verify there is initial state
    let initialState = [];
    for (let state in stateMap) {
      if (stateMap[state].initial) initialState.push(state);

      //events must be at least an empty object
      if (!stateMap[state].hasOwnProperty("events")) {
        stateMap[state].events = {};
      }
    }

    //Verify state map
    if (initialState.length === 0)
      throw new err.initStateNotInMap(
        `Initial state provided: ${initialState} || States: ${inspect(
          Object.keys(stateMap)
        )}`
      );
    if (initialState.length > 1)
      throw new err.multipleInitialStates(inspect(initialState));
  }

  getInitialState(stateMap) {
    for (let state in stateMap) {
      if (this.stateMap[state].initial) return state;
    }
  }
}

function actionsAsArray(actions?: SMAction | Array<SMAction>): Array<SMAction> {
  return actions ? asArray<SMAction>(actions) : [];
}

function asArray<T = any>(candidate: T | Array<T>): Array<T> {
  return Array.isArray(candidate) ? candidate : [candidate];
}

module.exports = {
  StateMachine: StateMachine,
  SMTraceLevel: SMTraceLevel,
};

/*
 * State map constraints
 *
 * 1. Any state can be either leaf state or region
 * 2. Region state must have property region: true
 * 3. There must be exactly ONE region or state that is root.
 * 4. Any region can be either concurrent or non-concurrent
 * 5. Non-concurrent region has exactly one active child state when active
 * 6. Concurrent region assumes to have one or more child regions
 * 7. In concurrent region when active all its children regions are active
 * 8. Concurrent region cannot have leaf states as children
 * 9. Non-concurrent region can have memory enabled, so when re-entered, the state will be set to where it left off.
 * 10. By default a region considered to be non-concurrent. To make region concurrent need to set concurrent: true in state map.
 *
 *
 * Example:
 *
 * Imagine an electircal device that has 2 modes:
 *  1. Lumen
 *  2. Music + rotation
 *
 *  It cannot do Lumen and play music/rotate at the same time.
 *
 *  Lumen mode has following substates:
 *    - green
 *    - yellow
 *    - red
 *    - off (initial)
 *
 * Music + rotation has 2 concurrent regions: music and rotation.
 *
 * Music substates are:
 *   - Playing
 *   - Off
 *
 * Rotation substates are
 *  - Off
 *  - Rotating left
 *  - Rotating right
 *
 * We also have power state, which can be on or off.
 * If power goes off it forces the system out of all states.
 *
 * Here's the state map for such machine:
 *
  {
     powerOff: {
        root: true,
        events: {
            powerOn: {
                state: "powerOn",
                actions: ...
            }
        }
     },

     powerOn: {
         region: true,
         events: {
             powerOff: {
                 state: "powerOff",
                 actions: ...
             }
         }
     },

     lumen: {
         region: true,
         parent: "powerOn",
         transition: {
             switchToMusicRotation: {
                 state: "musicRotation"
             }
         }
     },

     musicRotation: {
         region: true,
         concurrent: true,
         parent: "powerOn",
         initial: true,
         events: {
             switchToLumen: {
                 state: "lumen"
             }
         }

     },

     music: {
         region: true,
         parent: "musicRotation"
     },

     rotation: {
         region: true,
         parent: "musicRotation"
     },

     musicPlaying: {
         parent: "music",
         events: {
             stopMusic: {
                 state: "musicOff",
             }
         }
     },

     musicOff: {
         parent: "music",
         initial: true,
         events: {
             playMusic: {
                 state: "musicPlaying",
             }
         }
     },

     rotationOff: {
         parent: "rotation",
         initial: true,
         events: {
             rotateLeft: {
                 state: "rotationLeft"
             },
             rotateRight: {
                 state: "rotationRight"
             }
         }
     },

     rotationLeft: {

         parent: "rotation",
         events: {
             stopRotation: {
                 state: "rotationOff"
             },
             rotateRight: {
                 state: "rotationRight"
             }
         }
     }

     rotationRight: {
         parent: "rotation",
         events: {
             rotateLeft: {
                 state: "rotationLeft"
             },
             stopRotation: {
                 state: "rotationOff"
             }
         }
     }
  }
 /

*/
