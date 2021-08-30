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
    expect(sm).toBeDefined();
    expect(sm.name).toBe("State machine");
    expect(sm.state === "start");
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
    expect(sm).toBeDefined();
    expect(sm.name).toBe("FOO");
    expect(sm.state === "start");
  });
});

describe("When handle function is called", () => {});
