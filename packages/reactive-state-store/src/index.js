const {createStore} = require('./store');

const counterStore = createStore({
  // give the store a name under which it is available globally for dev tools
  name: `counter`,

  getInitialState() {
    return 0;
  },

  onStart({increment, decrement}) {
    // do something when the first subscriber subscribes to this store
  },

  onStop() {
    // do something when the last subscriber unsubscribes from this store
  },

  actions: {
    increment(currentState, n=1) {
      return currentState + n;
    },

    decrement(currentState, n=1) {
      return currentState - n;
    }
  }
});

// how to use it outside of react
counterStore.observable.subscribe(v => {
  console.log('value: ', v);
});

// how to execute actions
counterStore.actions.increment(3);
counterStore.actions.decrement(2);
