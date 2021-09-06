# ADV-STATE: A FEATURE RICH STATE MACHINE
This implementation of a state machine made to overcome some limitations of famous XState.
This is currently in Alpha stage, so documentation will be added, bugs fixed, and API may drastically change.


# What can it do
1. Simple state management with entry, exit and onTransition actions.
2. Nested states.
3. Guarded transitions with possibility to have multiple guards for a single transition.
4. Supports and encourages message bus integration to externalize event handling logic.
5. Supports "onAction" messages (pushed to the message bus).
6. Configurable error handling and error behavior
7. Extensible logger interface
8. Extensible message bus interface
9. Can be "visited" by an arbitrary visitor that conforms to the visitor interface (useful for translation or code generation)

# API
## Initialization

``` typescript

import { StateMachine } from 'adv-state'

const sm = new StateMachine({
    name: "Some machine name", 
    messageBus: yourMessageBus,
    stateMap: {
        1: {
            initial: true, /*Must exactly one initial state for a single level*/
            entry: [/*Single function or array of entry functions*/], 
            entryMessage: "IN_ONE", /*This message will be pushed to the message bus with passed payload once state entered*/
            exitMessage: "EXIT_ONE", /*This message will be pushed to the message bus with passed payload just before leaving the state*/
            exit: [/*Single function or array of exit functions*/], 
            states: {
                /*nested states*/
            }, 
            events: { /*Supported events in current state */
                eventOne: [
                    {
                        toState: 2,
                        guards: [ /*Single function or array of functions that must return true or false*/ ], 
                        actions: [ /*Single function or array of action functions */ ], 
                        message: "EVENT_ONE", /*This  message will be pushed to the message bus with passed payload when event fires*/
                    }, 
                    
                    {
                        toState: 3,
                        guards: [/*Different set of guards that if passed, this transition will take place*/]
                    },
                    ...
                ]
            }, 
        },

        2: {
            final: true // Once entered, the machine is not going to process any events
            // State 2 description
        }, 
        
        3: {
           // State 3 description
        }
    }
})

// To enter initial state
sm.run()

// Sending events could be done directly like this:
sm.handle.eventOne(/* some payload */)

// But better way is to send event through message bus 
// The message bus must call update method on state machine and pass a payload in form of array:
sm.update(["eventOne", {/*payload*/}])

```

# TO BE CONTINUED...





