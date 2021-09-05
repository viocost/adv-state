import StateMachine from "../AdvStateMachine";

describe("Advanced test with guard conditions", () => {
  const sm = prepareTestSM();
  beforeAll(() => {
    sm.run();
    sm.handle.nonExistant();
  });

  it("Should verify the output", () => {
    expect(sm.halted).toBeFalsy();
  });
});

function prepareTestSM() {
  return new StateMachine({
    name: "Guard tester",
    contextObject: null,

    stateMap: {
      0: {
        initial: true,
      },
    },
  });
}
