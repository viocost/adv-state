# ADV-STATE: A FEATURE RICH STATE MACHINE
This implementation of a state machine made to overcome some limitations of famous XState.
This is currently in Alpha stage, so documentation will be added, bugs fixed, and API may drastically change.


# What can it do
1. Simple state management with entry, exit and onTransition actions.
2. Nested states.
3. Parallel regions.
4. Guarded transitions with possibility to have multiple guards for a single transition.
5. Supports and encourages message bus integration to externalize event handling logic.
6. Supports "onAction" messages (pushed to the message bus).
7. Configurable error handling and error behavior
8. Extensible logger interface
9. Extensible message bus interface
10. Can be "visited" by an arbitrary visitor that conforms to the visitor interface (useful for translation or code generation)


# How it works

## Initialization

The simplest example, machine with 2 states:

``` typescript

import { StateMachine } from 'adv-state'

// Assuming you have a message bus
import { MessageBus } from 'my-message-bus'


const sm = new StateMachine({
  name: 'My first state machine', 
  messageBus: new MessageBus(), 

  stateMap: {

    state1: {
      initial: true, 
      events: { 
        go2: { 
           toState: 'state2' 
        }
      }
    }, 

    state2: {
      final: true
    }

  }
})


sm.run()
```



## Events and event descriptors
We interact with the state machine by sending it events.
The state machine will react on received events depending on state it is in. 

Event descriptor can have following properties:
* toState - defines a state transition for the event
* actions - a single callback or an array of callbacks that will be invoked when event occurs
* guards - a single funciton or an array of functions that return true or false.
  Only if all guards evaluate to true the event will be executed (meaning actions invoked and transition performed)
* message - specified message will be pushed to the message bus

Example: 
``` typescript
const stateMap =  {

    state1: {
      initial: true, 

      events: { // <= event descriptors container
        bar: [
           { // event descriptor
             toState: 'state2', 
             actions: [/*some callbacks*/], 
             guards: [/*some guards*/], 
             message: "DOING_BAR"
           }, 
           
           {
             actions: (eventName, payload)=>{/*do work*/}, 
             guards: (eventName, payload)=>/*evaluate*/, 
           }
        ], 
        
        foo: {
          toState: 'state3', 
          actions: [/*some other actions*/], 
          message: "DOING_FOO"
        }

      }
    }, 
    
    state2: {/* State description*/}, 
    state3: {/* State description*/}
  }
})

```



## Sending events
There are 3 ways to send events to the machine:

1. Direct way
    `sm.handle.event(payload)`

2. Through message bus. The message bus must call on the machine like this
   `subscriber.update('message', payload)` // subscriber is a state machine
   
3. Update is a public method and can be used directly to send events:
   `sm.update('message', payload)`


# TO BE CONTINUED...





