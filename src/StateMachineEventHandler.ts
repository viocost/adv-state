import { StateMachine } from "./AdvStateMachine";
import { InErrorState } from "./StateMachineError";

export function createHandler(stateMachine: StateMachine) {
  return new Proxy(stateMachine, {
    get(target: StateMachine, event: string): Function {
      target.logger.debug(`Received event ${event}`);
      if (target.error) throw new InErrorState("");
      if (target.eventMap.has(event)) {
        return (payload?: any) => {
          setImmediate(() => {
            if (target.error) return;
            try {
              target.logger.debug(`Processing`);
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
      }

      target.logger.warn(`Illegal event received: ${String(event)}`);
      return () => {};
    },
  }) as any;
}
