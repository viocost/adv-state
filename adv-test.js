const { StateMachine } = require("./AdvStateMachineDev")

// State map building

let sm = new StateMachine(null, {
    name: "State map test",
    stateMap: {
        powerOff: {
        },

        powerOn: {
            entry: ()=>{console.log("Entry powerOn")},
            initial: true,
            transitions: {
                setPowerOff: {
                    state: "powerOff"
                }
            }
        },

        illumination: {
            entry: ()=>{console.log("Entry illumination")},
            initial: true,
            parent: "powerOn",
            transitions: {
                toMusicRotation: {
                    state: "music-rotation"
                }
            }
        },

        musicRotation: {
            parent: "powerOn",
            region: true,
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
            initial: true,
            entry: ()=>{console.log("Entry illuminationOff")},
            exit: ()=>{console.log("exit illuminationOff")},
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


//None or multiple initial states
try{
    //State name typo
    let sm2 = new StateMachine(null, {
        name: "State map test",
        stateMap: {
            powerOff: {
                initial: true,
            },

            powerOn: {
                initial: true,
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
    console.log("Test failed: multiple initials");
}catch(err){
    console.log("Test passed: multiple initials");
}


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
                initial: true,
                parent: "powerOn",
                transitions: {
                    toMusicRotation: {
                        state: "music-rotation"
                    }
                }
            },


            musicRotation: {
                parent: "powerOn",
                initial: true,
                transitions: {
                    toIllumination: {
                        state: "musicRotation"
                    }
                }
            },
        }
    })
    console.log("Test failed");
}catch(err){
    console.log("Test passed: multiple initial substates");
}
