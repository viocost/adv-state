import { IMessageBus } from "obs-bus";

interface IStateMachine {}

type SMEvent = string | symbol | number;

type SMContext = {};

type SMAction<TData = any, TReturn = any> = (
  event: SMEvent,
  data: TData,
  stateMachine: IStateMachine
) => TReturn;

type SMGuard<TData = any> = (
  event: SMEvent,
  data: TData,
  stateMachine: IStateMachine
) => boolean;

type TransitionDescription = {
  state: string | symbol | number;
  actions: SMAction | Array<SMAction>;
  guards: SMGuard | Array<SMGuard>;
};

type Transitions = {
  [key: string | symbol | number]:
    | TransitionDescription
    | Array<TransitionDescription>;
};

type StateDescription = {
  initial?: true;
  entry?: SMAction | Array<SMAction>;
  exit?: SMAction | Array<SMAction>;
  transitions?: Transitions;
};

type StateMap = {
  [key: string | symbol | number]: StateDescription;
};

type StateMachineConfig = {
  name?: string;
  messageBus?: IMessageBus;
  stateMap: StateMap;
};

const config: StateMachineConfig = {
  name: "foo",
  stateMap: {
    start: {},
  },
};
