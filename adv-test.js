const { StateMachine } = require("./AdvStateMachineDev")

// State map building

let sm = new StateMachine(null, {
    name: "State map test",
    stateMap: {
        powerOff: {
            initial: true,

        },

        powerOn: {
            transitions: {
                setPowerOff: {
                    state: "powerOff"
                }
            }
        },

        illumination: {
            parent: "powerOn",
            transitions: {
                toMusicRotation: {
                    state: "music-rotation"
                }
            }
        },

        musicRotation: {
            parent: "powerOn",
            transitions: {
                toIllumination: {
                    state: "illumination"
                }
            }
        },

        illuminationOn: {
            parent: "illumination"
        },

        illuminationOff: {
            parent: "illumination",
            transitions: {
                setIlluminationOn: {
                    state: "illuminationOn"
                }
            }
        }
    }

})


try{

    //State name typo
    let sm1 = new StateMachine(null, {
        name: "State map test",
        stateMap: {
            powerOff: {
                initial: true,

            },

            powerOn: {
                transitions: {
                    setPowerOff: {
                        state: "powerOff"
                    }
                }
            },

            illumination: {
                parent: "powerOnnn",
                transitions: {
                    toMusicRotation: {
                        state: "music-rotation"
                    }
                }
            },
        }
    })
    console.log("Test failed");
}catch(err){
    console.log("Test passed: typo");
}
