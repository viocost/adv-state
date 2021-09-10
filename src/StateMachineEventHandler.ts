import StateMachine from "./AdvStateMachine";
import { InHaltedState } from "./StateMachineError";

export function createHandler(stateMachine: StateMachine) {
  return new Proxy(stateMachine, {
    get(target: StateMachine, event: string): Function {
      target.logger.debug(`Received event ${event}`);
      if (target.halted) throw new InHaltedState("");

      if (!target.eventSet.has(event)) {
        target.logger.warn(`Illegal event received: ${String(event)}`);
        return () => {};
      }

      return (payload?: any) => {
        setImmediate(() => {
          if (target.halted) return;
          try {
            target.processEvent(event, payload);
          } catch (err) {
            target.logger.warn(
              `${target.name}: Event handler "${String(
                event
              )}" thrown an exception: ${err}`
            );
          }
        });
      };
    },
  }) as any;
}
