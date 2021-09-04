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
} from "./types";

import { inspect } from "util";
import { State } from "./State";
import { LoggerContainer } from "./LoggerContainer";
import { LogFilter } from "./LogFilter";
import { EventMapper } from "./EventMapper";

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
  name: string;

  // Will be passed as this to all handlers
  contextObject: Object;

  // global error
  error: boolean;

  // Maps events to states
  eventMap: Map<SMEvent, State>;

  // Event handler
  handle: Function;

  // Message bus
  messageBus: SMMessageBus;

  // State tree root
  root: State;
  //onCrash?: CrashActionDescriptor;

  constructor({
    name,
    stateMap,
    messageBus = null,
    contextObject = null,
    onCrash = null,
    logLevel = LogLevel.WARN,
  }: StateMachineConfig) {
    this.initLogger(logLevel);
    this.initMessageBus(messageBus);
    this.initStateTree(stateMap);
    this.error = false;
    this.name = name || "State Machine";
    this.root = this.initStateTree(stateMap);
    this.validateStateMap(this.root);
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

  getOnCrashAction() {
    return this.onCrash;
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
