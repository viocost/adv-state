const  { StateMachine } = require("../client/src/js/lib/AdvStateMachine.js");

const Guards = {
    t: ()=>true,
    f: ()=>false,
}

function getLightBulbSM(){
    return new StateMachine(undefined, {
        trace: true,
        traceLevel: StateMachine.TraceLevel.DEBUG,
        name: "Light Bulb",
        stateMap: {
            off: {
                initial: true,
                entry: ()=>{ console.log("I am entry action for off state") },
                exit:  ()=>{ console.log("I am exit action for off state") },
                transitions: {
                    toggle: [
                        {
                            actions: ()=>{ console.log("I am toggle event handler for state OFF") },
                            state: "on",
                        }
                    ]
                }
            },

            on: {
                entry: ()=>{ console.log("I am entry action for on state") },
                exit:  ()=>{ console.log("I am exit action for on state") },
                transitions: {
                    toggle: {
                        actions: ()=>{ console.log("I am toggle event handler for state ON") },
                        state: "off"
                    }
                }
            }
    },})
}

class Lamp{


    constructor(machine = this.getProductionSM(), machineControlMode = {
        traceLevel:  StateMachine.TraceLevel.DEBUG,
        msgNotExistMode: StateMachine.Warn
    }){
        this.name = 'Lamp'
        this.sm = new StateMachine(this, machine, machineControlMode);
    }

    sayArray(){
        console.log("ARRAY");
    }

    whistle(){
        console.log("whsshshshshs");
    }

    turnOn(){
        console.log("turnOn call");
    }

    turnOff(){
        console.log("turnOff call");
    }

    handleWhistle(){
        this.sm.handle.whistle();
    }

    toggle(a, b, c){
        this.sm.handle.toggle(a, b, c)
    }

    beep(a, b, c){
        console.log(`BEEP! Args: ${a} ${b} ${c} ` );
    }

    sayName(a, b, c){
        console.log(`My name is ${this.name} Args: a:  ${a} b: ${b} c: ${c}`);
    }

    testArray(){
        this.sm.handle.testArray();
    }

    dieWithError(){
        this.sm.handle.dieWithError();
    }

    getProductionSM(){
        return {
            name: "Production lamp SM",
            initialState: "off",
            stateMap: {
                on:{
                    transitions: {
                        toggle: {
                            actions: this.turnOff,
                            state: "off",
                            guards: [Guards.t, Guards.t]
                        },

                        whistle: {
                            actions: [ this.sayName, this.whistle ],
                            guards: [ Guards.t, Guards.t ]

                        },

                        dieWithError: [
                            {
                                actions: [ this.sayName ],
                                guards: [Guards.t, Guards.t]
                            },

                            {
                                actions: [ this.whistle ],
                                guards: [Guards.t, Guards.t]
                            }
                        ]


                    }
                },

                off: {
                    initial: true,
                    transitions: {
                        toggle: {
                            actions: [ this.turnOn, this.beep, this.sayName ],
                            state: "on",
                            guards: [Guards.t, Guards.t]
                        },

                        whistle: {
                            actions: [ this.sayName, this.whistle ],

                        },

                        testArray: [
                            {

                                actions: [ this.sayArray ],
                                guards: [ Guards.t, Guards.t ]
                            },

                            {

                                actions: [ this.sayName, this.whistle ],
                                guards: [ Guards.t, Guards.f ]
                            }
                        ]
                    }
                }
            }
        }

    }
}


function getHeirarchicalSM(){
    return new StateMachine({}, { stateMap: {
        red: {
            entry: ()=>{ console.log("Entered RED") },
            exit: ()=>{ console.log("Leaving RED") },

            transitions: {
                "next": {
                    actions: ()=>{ console.log("Going green!") },
                    state: "green"
                }
            }
        },

        green: {
            entry: ()=>{ console.log("Entered GREEN") },
            exit: ()=>{ console.log("Leaving GREEN") },

            transitions: {
                "next": {
                    actions: ()=>{ console.log("Going green!") },
                    state: "yellow"
                },

                "run":{

                }
            }
        },

        yellow: {
            entry: ()=>{ console.log("Entered YELLOW") },
            exit: ()=>{ console.log("Leaving YELLOW") },

            transitions: {
                "next": {
                    actions: ()=>{ console.log("Going yellow!") },
                    state: "red"
                }
            }
        },

        walking: {
            entry: ()=>{ console.log("Started walking!") },
            exit: ()=>{ console.log("Stopped walking!") },
            parent: "green"

        },

        running: {

            entry: ()=>{ console.log("Started running!") },
            exit: ()=>{ console.log("Stopped running!") },
            parent: "green"
        }



    } })
}

function testLamp(){
    let lamp = new Lamp()


    lamp.toggle(1, 2, 3)
    lamp.handleWhistle()
    lamp.toggle(4, 5, 6)
    lamp.handleWhistle()
    lamp.testArray()
    lamp.toggle(7, 8, 9)
    lamp.handleWhistle()

    lamp.dieWithError()


    lamp.toggle(1, 2, 3)
    lamp.toggle(1, 2, 3)


}


function testLightBulb(){
    let sm = getLightBulbSM("off");
    sm.handle.toggle(1, 2, 3)
    sm.handle.toggle(4, 5, 6)
    sm.handle.toggle("Hey", 123, "boo")
    sm.handle.toggle('asdf', "foo")
}


//testLightBulb();

testLamp()
