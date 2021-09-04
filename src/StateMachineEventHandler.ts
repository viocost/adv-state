import { StateMachine } from "./AdvStateMachine";
import { InErrorState } from "./StateMachineError";

export function createHandler(stateMachine: StateMachine) {
  return new Proxy(stateMachine, {
    get(target: StateMachine, event: string): Function {
      //target.logger.log(`Received event ${event}`);
      if (target.error) throw new InErrorState("");
      if (target.eventMap.has(event))
        return (payload?: any) => {
          setImmediate(() => {
            if (target.error) return;
            try {
              target.processEvent(event, payload);
            } catch (err) {
              target.logger.warn(
                `${target.name}: Event handler "${String(
                  event
                )}" thrown an exception: ${err}`
              );
              const onCrash = target.getOnCrashAction();
              console.dir(onCrash);
              if (onCrash) {
                console.log("SENDING GLOBAL ERROR MESSAGE");
                target.sendMessageOnEvent(
                  onCrash.message as SMMessageName,
                  err
                );
              }

              if (target.isDebug()) throw err;
            }
          });
        };

      target.logger.log(`Illegal event received: ${String(event)}`);
      return () => {};
    },
  }) as any;
}
