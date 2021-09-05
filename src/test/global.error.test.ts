import StateMachine from "../AdvStateMachine";
import { SMErrorAction, SMMessageBusMessage } from "../types";
import { EventEmitter } from "events";

const errorMessage = "ERROR";

class FakeMBus extends EventEmitter {
  receivedMessages = [];
  sm: StateMachine;
  subscribe(sm: StateMachine) {
    this.sm = sm;
  }

  deliver(msg: SMMessageBusMessage, ...rest: any) {
    const [mName, payload] = msg;
    this.emit(mName as string, payload);
    this.receivedMessages.push(mName);
  }
}

describe("When ignore action specified on action exception", () => {
  const actions = [
    jest.fn().mockImplementation(() => {
      throw new Error();
    }),
    jest.fn(),
  ];
  const bus = new FakeMBus();
  const sm = prepareTestSM(bus, SMErrorAction.Ignore, actions, []);

  beforeAll(() => {
    return new Promise((resolve, reject) => {
      sm.run();
      sm.handle.doneZero({ foo: "bar" });
      setTimeout(resolve, 100);
    });
  });

  it("It should finish the transition without notifying error", () => {
    expect(bus.receivedMessages[0]).toBeUndefined;
    expect(actions[1]).toHaveBeenCalledTimes(1);
    expect(actions[0]).toHaveBeenCalledTimes(1);
    expect(sm.state).toBe("root.2");
    expect(sm.halted).toBeFalsy();
    expect(sm.errorneousHaltMessage).toBe(null);
  });
});

describe("When notify action specified on action exception", () => {
  const actions = [
    jest.fn().mockImplementation(() => {
      throw new Error();
    }),
    jest.fn(),
  ];
  const bus = new FakeMBus();
  const sm = prepareTestSM(bus, SMErrorAction.Notify, actions, []);

  beforeAll(() => {
    return new Promise((resolve, reject) => {
      sm.run();
      sm.handle.doneZero({ foo: "bar" });
      setTimeout(resolve, 100);
    });
  });

  it("It should finish the transition and send error message over message bus", () => {
    expect(bus.receivedMessages[0]).toBe(errorMessage);
    expect(sm.state).toBe("root.2");
    expect(actions[1]).toHaveBeenCalledTimes(1);
    expect(actions[0]).toHaveBeenCalledTimes(1);
    expect(sm.halted).toBeFalsy();
    expect(sm.errorneousHaltMessage).toBe(null);
  });
});

describe("When shutdown action specified on action exception", () => {
  const actions = [
    jest.fn().mockImplementation(() => {
      throw new Error();
    }),
    jest.fn(),
  ];
  const bus = new FakeMBus();
  const sm = prepareTestSM(bus, SMErrorAction.Shutdown, actions, []);

  beforeAll(() => {
    return new Promise((resolve, reject) => {
      sm.run();
      sm.handle.doneZero({ foo: "bar" });
      setTimeout(resolve, 100);
    });
  });

  it("Should halt state machine with error and throw the exception without calling next handler", () => {
    expect(bus.receivedMessages[0]).toBe(errorMessage);
    expect(sm.state).toBe("root");
    expect(actions[0]).toHaveBeenCalledTimes(1);
    expect(actions[1]).toHaveBeenCalledTimes(0);
    expect(sm.halted).toBeTruthy();
    expect(sm.errorneousHaltMessage).toBeInstanceOf(Error);
  });
});

describe("When ignore action specified on entry action exception", () => {
  const actions = [
    jest.fn().mockImplementation(() => {
      throw new Error();
    }),
    jest.fn(),
  ];
  const bus = new FakeMBus();
  const sm = prepareTestSMEntryError(bus, SMErrorAction.Ignore, actions, []);

  beforeAll(() => {
    return new Promise((resolve, reject) => {
      sm.run();
      sm.handle.doneZero({ foo: "bar" });
      setTimeout(resolve, 100);
    });
  });

  it("It should ignore error and finish the transition without notifying error", () => {
    expect(bus.receivedMessages[0]).toBeUndefined();
    expect(sm.state).toBe("root.2");
    expect(actions[1]).toHaveBeenCalledTimes(1);
    expect(actions[1]).toHaveBeenCalledTimes(1);
    expect(sm.halted).toBeFalsy();
    expect(sm.errorneousHaltMessage).toBe(null);
  });
});

describe("When notify action specified on entry action exception", () => {
  const actions = [
    jest.fn().mockImplementation(() => {
      throw new Error();
    }),
    jest.fn(),
  ];
  const bus = new FakeMBus();
  const sm = prepareTestSMEntryError(bus, SMErrorAction.Notify, actions, []);

  beforeAll(() => {
    return new Promise((resolve, reject) => {
      sm.run();
      sm.handle.doneZero({ foo: "bar" });
      setTimeout(resolve, 100);
    });
  });

  it("It should send error messge over message bus and finish the transition", () => {
    expect(bus.receivedMessages[0]).toBe(errorMessage);
    expect(sm.state).toBe("root.2");
    expect(actions[1]).toHaveBeenCalledTimes(1);
    expect(actions[1]).toHaveBeenCalledTimes(1);
    expect(sm.halted).toBeFalsy();
    expect(sm.errorneousHaltMessage).toBe(null);
  });
});

describe("When shutdown action specified on entry action exception", () => {
  const actions = [
    jest.fn().mockImplementation(() => {
      throw new Error();
    }),
    jest.fn(),
  ];
  const bus = new FakeMBus();
  const sm = prepareTestSMEntryError(bus, SMErrorAction.Shutdown, actions, []);

  beforeAll(() => {
    return new Promise((resolve, reject) => {
      sm.run();
      sm.handle.doneZero({ foo: "bar" });
      setTimeout(resolve, 100);
    });
  });

  it("Should halt state machine and throw error without calling next action. Error note should be sent", () => {
    expect(bus.receivedMessages[0]).toBe(errorMessage);
    expect(sm.state).toBe("root.2");
    expect(actions[0]).toHaveBeenCalledTimes(1);
    expect(actions[1]).toHaveBeenCalledTimes(0);
    expect(sm.halted).toBeTruthy();
    expect(sm.errorneousHaltMessage).toBeInstanceOf(Error);
  });
});

describe("When ignore action specified on exit action exception", () => {
  const actions = [
    jest.fn().mockImplementation(() => {
      throw new Error();
    }),
    jest.fn(),
  ];
  const bus = new FakeMBus();
  const sm = prepareTestSMExitError(bus, SMErrorAction.Ignore, actions);

  beforeAll(() => {
    return new Promise((resolve, reject) => {
      sm.run();
      sm.handle.doneZero({ foo: "bar" });
      setTimeout(resolve, 100);
    });
  });

  it("It should ignore error and finish the transition without sending error", () => {
    expect(bus.receivedMessages[0]).toBeUndefined();
    expect(sm.state).toBe("root.2");
    expect(actions[1]).toHaveBeenCalledTimes(1);
    expect(actions[1]).toHaveBeenCalledTimes(1);
    expect(sm.halted).toBeFalsy();
    expect(sm.errorneousHaltMessage).toBe(null);
  });
});

describe("When notify action specified on entry action exception", () => {
  const actions = [
    jest.fn().mockImplementation(() => {
      throw new Error();
    }),
    jest.fn(),
  ];
  const bus = new FakeMBus();
  const sm = prepareTestSMExitError(bus, SMErrorAction.Notify, actions);

  beforeAll(() => {
    return new Promise((resolve, reject) => {
      sm.run();
      sm.handle.doneZero({ foo: "bar" });
      setTimeout(resolve, 100);
    });
  });

  it("It should send error over messge bus and finish the transition", () => {
    expect(bus.receivedMessages[0]).toBe(errorMessage);
    expect(sm.state).toBe("root.2");
    expect(actions[1]).toHaveBeenCalledTimes(1);
    expect(actions[1]).toHaveBeenCalledTimes(1);
    expect(sm.halted).toBeFalsy();
    expect(sm.errorneousHaltMessage).toBe(null);
  });
});

describe("When shutdown action specified on action exception", () => {
  const actions = [
    jest.fn().mockImplementation(() => {
      throw new Error();
    }),
    jest.fn(),
  ];
  const bus = new FakeMBus();
  const sm = prepareTestSMExitError(bus, SMErrorAction.Shutdown, actions);

  beforeAll(() => {
    return new Promise((resolve, reject) => {
      sm.run();
      sm.handle.doneZero({ foo: "bar" });
      setTimeout(resolve, 100);
    });
  });

  it("It should perform emergency shutdown and throw an error without leaving the state", () => {
    expect(bus.receivedMessages[0]).toBe(errorMessage);
    expect(sm.state).toBe("root.0");
    expect(actions[0]).toHaveBeenCalledTimes(1);
    expect(actions[1]).toHaveBeenCalledTimes(0);
    expect(sm.halted).toBeTruthy();
    expect(sm.errorneousHaltMessage).toBeInstanceOf(Error);
  });
});

function prepareTestSM(mBus, onActionError: SMErrorAction, actions, exit) {
  return new StateMachine({
    name: "Guard tester",
    contextObject: null,
    messageBus: mBus,
    onActionError: onActionError,
    mBusErrorMessage: errorMessage,

    stateMap: {
      0: {
        initial: true,
        events: {
          doneZero: {
            toState: 2,
            actions,
          },
        },
        exit,
      },

      2: {},
    },
  });
}

function prepareTestSMEntryError(
  mBus,
  onActionError: SMErrorAction,
  entry,
  exit
) {
  return new StateMachine({
    name: "Guard tester",
    contextObject: null,
    messageBus: mBus,
    onActionError: onActionError,
    mBusErrorMessage: errorMessage,

    stateMap: {
      0: {
        initial: true,
        events: {
          doneZero: {
            toState: 2,
          },
        },
        exit,
      },

      2: {
        entry,
      },
    },
  });
}

function prepareTestSMExitError(mBus, onActionError: SMErrorAction, exit) {
  return new StateMachine({
    name: "Guard tester",
    contextObject: null,
    messageBus: mBus,
    onActionError: onActionError,
    mBusErrorMessage: errorMessage,

    stateMap: {
      0: {
        initial: true,
        events: {
          doneZero: {
            toState: 2,
          },
        },
        exit,
      },

      2: {},
    },
  });
}
