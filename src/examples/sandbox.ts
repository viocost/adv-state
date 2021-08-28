let obsBus;

let agent1;
let agent2;

new StateMachine({
  name: "Some stateful agent N534",
  messageBus: obsBus,

  stateMap: {
    starting: {
      initial: true,
      transitions: {},
    },
  },
});

/* this is how it works now
function prepareUIStateMachine(){
    return new StateMachine(null, {
        name: "UI State Machine",
        stateMap: {
            start: {
                initial: true,
                transitions:{
                    toLogin: {
                        actions: initLogin,
                        state: "login"
                    },

                    toRegistration: {
                        actions: initRegistration,
                        state: "registration"
                    }
                }
            },

            login: {
                entry: loadingOff,
                transitions: {
                    start: {
                        state: "loggingIn",
                        actions: loggingIn
                    }
                }
            },

            loggingIn: {
                transitions: {
                    loginError: {
                        state: "login",
                        actions: handleLoginError
                    },

                    loginSuccess: {
                        actions: handleLoginSuccess,
                        state: "loggedIn"
                    }
                }
            },

            registration: {
                transitions: {
                    start: {
                        state: "registering"

                    }
                }
            },

            registering: {
                entry: loadingOn,
                transitions: {
                    registrationError: {
                        state: "registration",
                        actions: handleRegistrationError
                    },

                    registrationSuccess: {
                        state: "registrationSuccess",
                        actions: handleRegistrationSuccess
                    }
                }

            },

            registrationSuccess: {
                final: true
            },

            loggedIn: {
                entry: [ loadingOff ],
                transitions: {
                    disconnect: {

                    },
                }
            },
        }
    }, { traceLevel: StateMachine.TraceLevel.DEBUG, msgNotExistMode: StateMachine.Warn })
}

*/
