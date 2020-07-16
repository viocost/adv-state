const { StateMachine } = require("./AdvStateMachine")

function prepareStateMachine() {
    return new StateMachine(null, {
        name: "test",
        stateMap: {
            powerOff: {
                initial: true,
                transitions: {
                    powerOn: {
                        state: "powerOn",
                    }
                }
            },

            powerOn: {
                transitions: {
                    powerOff: {
                        state: "powerOff",
                    }
                }
            },

            lumen: {
                parent: "powerOn",
                transition: {
                    switchToMusicRotation: {
                        state: "musicRotation"
                    }
                }
            },

            musicRotation: {
                concurrent: true,
                parent: "powerOn",
                initial: true,
                transitions: {
                    switchToLumen: {
                        state: "lumen"
                    }
                }

            },

            music: {
                parent: "musicRotation"
            },

            rotation: {
                parent: "musicRotation"
            },

            musicPlaying: {
                parent: "music",
                transitions: {
                    stopMusic: {
                        state: "musicOff",
                    }
                }
            },

            musicOff: {
                parent: "music",
                initial: true,
                transitions: {
                    playMusic: {
                        state: "musicPlaying",
                    }
                }
            },

            rotationOff: {
                parent: "rotation",
                initial: true,
                transitions: {
                    rotateLeft: {
                        state: "rotationLeft"
                    },
                    rotateRight: {
                        state: "rotationRight"
                    }
                }
            },

            rotationLeft: {

                parent: "rotation",
                transitions: {
                    stopRotation: {
                        state: "rotationOff"
                    },
                    rotateRight: {
                        state: "rotationRight"
                    }
                }
            },

            rotationRight: {
                parent: "rotation",
                transitions: {
                    rotateLeft: {
                        state: "rotationLeft"
                    },
                    stopRotation: {
                        state: "rotationOff"
                    }
                }
            }



        }
    }, { msgNotExistMode: StateMachine.Warn, traceLevel: StateMachine.TraceLevel.DEBUG })
}

function main(){
    let sm = prepareStateMachine();
    sm.printStateTree()

}

main()
