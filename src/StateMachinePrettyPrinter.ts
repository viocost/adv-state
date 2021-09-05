import { StateMachineVisitor } from "./AbstractVisitor";
import { SMVisitor, IState, IStateMachine } from "./types";

export class StateMachinePrettyPrinter
  extends StateMachineVisitor
  implements SMVisitor
{
  indentation = 0;
  constructor(private indentStep = 2) {
    super();
  }

  enterStateMachine(stateMachine: IStateMachine) {
    console.log(`\nState machine ${stateMachine.name}`);
  }

  exitStateMachine(stateMachine: IStateMachine) {
    console.log(`STATE MACHINE END===============\n\n`);
  }

  enterState(state: IState) {
    console.log(`${this.spaces()}${state.name} {`);
    this.indent();
  }

  exitState(state: IState) {
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
