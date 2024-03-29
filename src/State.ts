import {
  SMStateName,
  SMEvent,
  IStateMachine,
  IState,
  EventDescription,
  StateDescription,
  SMAction,
  StateMap,
  Visitable,
  SMVisitor,
  Substates,
  Result,
} from "./types";
import { actionsAsArray, asArray } from "./util";

/**
 * A state is ultimately a set of transition actions event handlers and guard conditions
 *
 * When event is sent to the machine,
 * machine should find a state node that can handle that event.
 *
 * Once state node is found event processing begins on its parent.
 * Transition can only happen withing the same parent, other transitions are illegal
 *
 * Event processing:
 * First we find the right event descriptor by evaluating guards
 *k
 * With descriptor:
 * If there are just actions - then they are executed.
 *
 * If it is a transition, then we do following
 *
 * 1. We call children nodes that are active to withdraw and  perform exit actions
 * 2. Get new state node, ask it to recursevly resume
 *
 * What happens when some handler throws error? global state handling
 *
 *  */

export class State implements IState, Visitable {
  enabled: boolean = false;
  enabledSubstate?: IState;

  substates: Substates = {};
  logger: any;
  parallel: boolean = false;
  initial: boolean = false;
  final: boolean = false;
  isLeafState: boolean;

  // Reference for initial substate
  initialSubstate?: IState;

  // Reference for history substate
  historySubstate?: IState;

  constructor(
    private stateMachine: IStateMachine,
    public name: SMStateName,
    public config: StateDescription,
    public parent?: IState
  ) {
    this.stateMachine.logger.debug(`Initializing state ${name}`);
    this.initial = !!config.initial;
    this.final = !!config.final;
    this.createSubstates(config.states);
    this.isLeafState = Object.keys(this.substates).length === 0;
  }

  accept(visitor: SMVisitor) {
    visitor.enterState(this);
    for (let substate of Object.values(this.substates)) {
      substate.accept(visitor);
    }
    visitor.exitState(this);
  }

  private createSubstates(states?: StateMap) {
    if (!states) {
      return;
    }

    const stateKeys = Array.from(Object.keys(states));

    this.substates = stateKeys.reduce(
      (acc, key) => ({
        ...acc,
        [key]: createState(this.stateMachine, key, states[key], this),
      }),
      {} as Substates
    );

    this.initialSubstate = stateKeys.reduce(
      (acc, stateId) =>
        states[stateId].initial ? (this.substates[stateId] as State) : acc,
      undefined
    ) as State;

    this.stateMachine.logger.debug(
      `${this.name} Set initial substate to ${this.initialSubstate}`
    );
  }

  withdraw(eventName: SMEvent, eventArgs: any) {
    this.stateMachine.logger.debug(`Withdrawing from state ${this.name}`);
    // Call substates to withdraw
    this.withdrawSubstates(eventName, eventArgs);

    // Perform exit actions
    this.performExitActions(eventName, eventArgs);
    this.sendExitMessage(eventArgs);

    // Set itself off
    this.setEnabled(false);
  }

  withdrawSubstates(eventName: SMEvent, eventArgs: any) {
    if (this.parallel) {
    } else {
      this.enabledSubstate?.withdraw(eventName, eventArgs);
      this.setEnabledSubstate(undefined);
    }
  }

  resume(eventName?: SMEvent, eventArgs?: any) {
    // set myself enabled
    this.setEnabled(true);

    // call entry actions
    this.sendEntryMessage(eventArgs);
    this.performEntryActions(eventName, eventArgs);

    this.resumeSubstates(eventName, eventArgs);

    this.checkFinal();
  }

  resumeSubstates(eventName: SMEvent, eventArgs: any) {
    // call resume on child state that must be activated
    // We should either resume initial child,
    // or the last tha has been active,
    // or specified
    // but for now only initial

    const resumingSubstate = this.getResumingSubstate();

    resumingSubstate?.resume(eventName, eventArgs);
    this.setEnabledSubstate(resumingSubstate);
    this.setHistorySubstate(this.historySubstate || resumingSubstate);
  }

  getResumingSubstate() {
    return this.initialSubstate;
  }

  hasEvent(event: SMEvent): boolean {
    return this.config.events && event in this.config.events;
  }

  setEnabledSubstate(state?: IState) {
    this.enabledSubstate = state;
  }

  setHistorySubstate(state?: IState) {
    this.historySubstate = state;
  }

  setEnabled(isEnabled: boolean) {
    this.enabled = isEnabled;
  }

  //This function called by child state
  performTransition(
    newStateName: SMStateName,
    eventName: SMEvent,
    eventArgs?: any
  ) {
    // set childState to inactive
    this.setEnabledSubstate(undefined);

    // resume new state to active
    const newState = this.substates[newStateName];
    newState.resume(eventName, eventArgs);

    // set new state to active
    this.setEnabledSubstate(newState);
    this.setHistorySubstate(newState);
  }

  private performExitActions(eventName: SMEvent, eventArgs?: any) {
    this.stateMachine.logger.debug(
      `Performing exit actions in state ${this.name}`
    );
    const exitActions = actionsAsArray(this.config.exit);

    this.performActions(exitActions, eventName, eventArgs);
  }

  private performEntryActions(eventName: SMEvent, eventArgs?: any) {
    this.stateMachine.logger.debug(
      `Performing entry actions in state ${this.name}`
    );

    const entryActions = actionsAsArray(this.config.entry);

    this.performActions(entryActions, eventName, eventArgs);
  }

  private performActions(
    actions: Array<SMAction>,
    eventName: SMEvent,
    eventArgs?: any
  ) {
    for (let action of actions) {
      try {
        action.call(null, null, eventName, eventArgs);
      } catch (error) {
        this.stateMachine.handleActionError(error, this, eventName, eventArgs);
      }
    }
  }

  private checkFinal() {
    if (this.final) {
      this.stateMachine.halt(Result.Finished);
    }
  }

  processEvent(eventName: SMEvent, eventArgs?: any) {
    if (!this.enabled) {
      return;
    }

    //this.logProcessEventStart(eventName, eventArgs);
    let eventDescription = this.getEventDescription(eventName, eventArgs);

    // Abort if no possible event handling found
    if (!eventDescription) return;

    //perform exit actions if transition
    this.withdrawOnTransition(eventDescription, eventName, eventArgs);

    //Execute transition actions / send message
    this.executeEvent(eventDescription, eventName, eventArgs);

    //if transition ask parent state to perform transition
    this.requestTransitionOnTransition(eventDescription, eventName, eventArgs);
  }

  withdrawOnTransition(
    eventDescription: EventDescription,
    eventName: SMEvent,
    eventArgs: any
  ) {
    if (eventDescription.toState) {
      this.withdraw(eventName, eventArgs);
    }
  }

  private executeEvent(
    eventDescription: EventDescription,
    eventName: SMEvent,
    eventArgs?: any
  ) {
    const { actions, message } = eventDescription;

    this.stateMachine.dispatchMessage(message, eventArgs);

    this.performOnTransitionActions(
      actionsAsArray(actions),
      eventName,
      eventArgs
    );
  }

  requestTransitionOnTransition(
    eventDescription: EventDescription,
    eventName: SMEvent,
    eventArgs: any
  ) {
    if (eventDescription.toState) {
      this.parent.performTransition(
        eventDescription.toState,
        eventName,
        eventArgs
      );
    }
  }

  sendEntryMessage(eventArgs?: any) {
    this.stateMachine.dispatchMessage(this.entryMessage(), eventArgs);
  }

  sendExitMessage(eventArgs?: any) {
    this.stateMachine.dispatchMessage(this.exitMessage(), eventArgs);
  }

  sendTransitionMessage(event: EventDescription, eventArgs?: any) {
    this.stateMachine.dispatchMessage(event.message, eventArgs);
  }

  private exitMessage(): string {
    return `${this.stateMachine.exitStateMessagePrefix}${this.name}`;
  }

  private entryMessage(): string {
    return `${this.stateMachine.enterStateMessagePrefix}${this.name}`;
  }

  private performOnTransitionActions(
    actions: Array<SMAction>,
    eventName: SMEvent,
    eventArgs: any
  ) {
    if (actions.length === 0) return;

    //this.logPerformingActions(ActionType.Transition, this.state, eventName);
    this.performActions(actionsAsArray(actions), eventName, eventArgs);
  }

  getEventDescription(eventName: SMEvent, eventArgs?: any) {
    let descriptions = this.validateSingleLegalDescriptions(
      this.getGuardsPassingEventDescriptions(eventName, eventArgs),
      eventName
    );

    return descriptions[0];
  }

  validateSingleLegalDescriptions(
    descriptions: Array<EventDescription>,
    eventName: SMEvent
  ) {
    if (descriptions.length > 1) {
      this.stateMachine.handleAmbiguousTransition(this, eventName);
      throw new Error("More than one transition error");
    }

    return descriptions;
  }

  getGuardsPassingEventDescriptions(eventName: SMEvent, eventArgs: any) {
    return asArray(this.config.events[eventName]).filter((description) =>
      this.areGuardsPassed(description, eventName, eventArgs)
    );
  }

  areGuardsPassed(
    evDescription: EventDescription,
    eventName: SMEvent,
    eventArgs: any
  ) {
    try {
      return actionsAsArray(evDescription.guards).reduce(
        (res, guard) => guard.call(null, null, eventName, eventArgs) && res,
        true
      );
    } catch (error) {
      this.stateMachine.logger.debug(`Handling guard error`);
      this.stateMachine.handleGuardError(error, this, eventName, eventArgs);
      return false;
    }
  }
}

class ParallelState extends State {
  parallel = true;
  withdrawSubstates(eventName: SMEvent, eventArgs: any) {
    for (const state in this.substates) {
      this.substates[state].withdraw(eventName, eventArgs);
    }
  }

  resumeSubstates(eventName: SMEvent, eventArgs: any) {
    for (const state in this.substates) {
      this.substates[state].resume(eventName, eventArgs);
    }
  }
}

export function createState(
  stateMachine: IStateMachine,
  name: SMStateName,
  config: StateDescription,
  parent?: IState
) {
  return config.parallel
    ? new ParallelState(stateMachine, name, config, parent)
    : new State(stateMachine, name, config, parent);
}
