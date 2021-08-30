import { StateMachine } from "./src/AdvStateMachine";
class A {
  handle = new Proxy(this, {
    get: (target, prop: string) => {
      console.log(`prop is: ${prop}`);
      return () => prop;
    },
  }) as any;
}

const sm = new StateMachine({
  stateMap: {
    start: {
      initial: true,
    },
  },
});

sm.run();

const a = new A();

console.log(sm.handle.boo());
