import { StateMachine } from "./AdvStateMachine";

export function createHandler(stateMachine: StateMachine) {
  return new Proxy(stateMachine, {
    get(target: StateMachine, prop: string): Function {
      //target.logger.log(`Received event ${prop}`);
      if (target.error) throw new err.blown(target.error);
      if (target.eventMap.has(prop))
        return (payload?: any) => {
          setImmediate(() => {
            if (target.error) return;
            try {
              target.processEvent(prop, payload);
            } catch (err) {
              target.logger.warn(
                `${target.name}: Event handler "${String(
                  prop
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

      target.logger.log(`Illegal event received: ${String(prop)}`);
      return () => {};
    },
  }) as any;
}
