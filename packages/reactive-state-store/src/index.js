const {createStore} = require('./store');

let it1, it2;

const counterStore = createStore({
  name: `counter`,

  getInitialState() {
    return 0;
  },

  onStart({increment, decrement}) {
    increment(2);
    it1 = setInterval(() => counterStore.actions.increment(5), 1000);
    it2 = setInterval(() => counterStore.actions.decrement(3), 1000);
  },

  onStop() {
    clearInterval(it1);
    clearInterval(it2);
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

const subscription = counterStore.observable.subscribe(v => {
  console.log('value: ', v);
  if (v > 10) {
    subscription.unsubscribe();
  }
});
