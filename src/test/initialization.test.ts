import { StateMachine } from "../AdvStateMachine";

describe("Basic initialization", () => {
  it("Should initialize state machine", () => {
    const sm = new StateMachine({
      stateMap: {
        start: {
          initial: true,
        },
      },
    });

    expect(sm.state).toBe("");
    sm.run();
    expect(sm).toBeDefined();
    expect(sm.name).toBe("State Machine");

    expect(sm.state).toBe("root.start");
  });

  it("Should initialize state machine with custom name", () => {
    const sm = new StateMachine({
      name: "FOO",
      stateMap: {
        start: {
          initial: true,
        },
      },
    });

    sm.run();
    expect(sm).toBeDefined();
    expect(sm.name).toBe("FOO");
    expect(sm.halted).toBeFalsy();
  });
});

describe("When transition to non-existant state provided in state map", () => {
  it("Should throw an error", () => {
    function initFaultySm() {
      return new StateMachine({
        name: "Faulty State Map",
        stateMap: {
          1: {
            initial: true,
            events: {
              toTwo: {
                toState: "some-non-existant-state",
              },
            },
          },
        },
      });
    }

    expect(initFaultySm).toThrowError();
  });
});

describe("When transition to state that is not within the parent state provided in state map", () => {
  it("Should throw an error", () => {
    function initFaultySm() {
      return new StateMachine({
        name: "Faulty State Map",
        stateMap: {
          1: {
            states: {
              a1: {
                events: {
                  foo: {
                    toState: "b1",
                  },
                },
              },
              a2: {},
            },
          },
          2: {
            states: {
              b1: {},
            },
          },
        },
      });
    }

    expect(initFaultySm).toThrowError();
  });
});

describe("When legal state map with nested states passed", () => {
  it("Should init state machine", () => {
    function initSm() {
      return new StateMachine({
        name: "SM",
        stateMap: {
          1: {
            initial: true,
            states: {
              a1: {
                initial: true,
                events: {
                  foo: {
                    toState: "a2",
                  },
                },
              },
              a2: {},
            },
          },
          2: {
            states: {
              b1: {
                initial: true,
              },
            },
          },
        },
      });
    }

    const sm = initSm();
    expect(sm.name).toBe("SM");
    expect(sm.halted).toBeFalsy();
  });
});

describe("When state level doesn't have any initial state", () => {
  it("Should throw an error", () => {
    function initFaultySm() {
      return new StateMachine({
        name: "Faulty State Map",
        stateMap: {
          1: {
            events: {
              toTwo: {},
            },
          },
        },
      });
    }

    expect(initFaultySm).toThrowError();
  });
});
