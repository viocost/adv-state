import { StateMachine } from "./AdvStateMachine";
import { State } from "./State";
import { SMVisitor, StateVisitor } from "./types";

export class StateMachinePrettyPrinter implements SMVisitor, StateVisitor {
  indentation = 0;
  constructor(private indentStep = 2) {}

  enterStateMachine(stateMachine: StateMachine) {
    console.log(`\nState machine ${stateMachine.name}`);
  }

  exitStateMachine(stateMachine: StateMachine) {
    console.log(`STATE MACHINE END===============\n\n`);
  }

  enterState(state: State) {
    console.log(`${this.spaces()}${state.name} {`);
    this.indent();
  }

  exitState(state: State) {
    this.dedent();
    console.log(`${this.spaces()}}`);
  }

  indent() {
    this.indentation += this.indentStep;
  }

  dedent() {
    this.indentation -= this.indentStep;
  }

  spaces() {
    return " ".repeat(this.indentation);
  }
}
