const {createStore} = require('./store');

const counterStore = createStore({
  name: `counter`,

  getInitialState() {
    return 0;
  },

  actions: {
    increment(currentState, n=1) {
      console.log('increment by ', n);
      return currentState + n;
    },

    decrement(currentState, n=1) {
      console.log('decrement by ', n);
      return currentState - n;
    }
  }
});

counterStore.observable.subscribe(v => console.log('value: ', v));
setInterval(() => counterStore.actions.increment(5), 1000);
setInterval(() => counterStore.actions.decrement(3), 1000);
