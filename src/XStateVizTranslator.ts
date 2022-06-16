import StateMachineVisitor from "./AbstractVisitor";
import { IStateMachine, IState, EventDescription } from "./types";
import { actionsAsArray } from "./util";

export class XStateVizTranslator extends StateMachineVisitor {
  private indentation = 0;
  private indentStep = 2;

  write(str: string) {
    console.log(`${" ".repeat(this.indentation)}${str}`);
  }

  enterStateMachine(stateMachine: IStateMachine) {
    this.write(`const machine = Machine({`);
    this.indent();
    this.write(`id: '${stateMachine.name}'`);
    this.write(`initial: '${stateMachine.root.initialSubstate.name}'`);
    this.write(`states: {`);
    this.indent();
  }
  exitStateMachine(stateMachine: IStateMachine) {
    this.dedent();
    this.write(`}`);
    this.dedent();
    this.write(`})`);
  }
  enterState(state: IState) {
    this.write(`${state.name}: {`);
    this.indent();
    if (state.final) {
      this.write(`type: 'final',`);
    }

    if (state.parallel) {
      this.write(`type: 'parallel',`);
    }
    if (state.initialSubstate) {
      this.write(`initial: ${state.initialSubstate.name}`);
    }
    this.writeActions("entry", state.config.entry);
    this.writeActions("exit", state.config.exit);
  }
  exitState(state: IState) {
    this.dedent();
    this.write("}");
  }
  enterEventDescription(eventName, eventDescription: EventDescription) {}
  exitEventDescription(eventName, eventDescription: EventDescription) {}

  indent() {
    this.indentation += this.indentStep;
  }

  dedent() {
    this.indentation -= this.indentStep;
  }

  writeActions(actionType: "entry" | "exit", actions?: any) {
    if (!actions) return;

    const names = actionsAsArray(actions).map(
      (action) => action.name || "action"
    );
    this.write(`${actionType}: [${names.join(", ")}]`);
  }
}
