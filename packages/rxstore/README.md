# rxstore

*For more information about the [rxstore](https://github.com/bripkens/rxstore) project, refer to the root-readme of
the [rxstore](https://github.com/bripkens/rxstore) project.*

Store implementation.

## Installation
```
npm install --save @bripkens/rxstore
–or–
yarn add @bripkens/rxstore
```

## Usage
rxstore differentiates between stores and tracking stores.

 - *stores*: Hold state and can be directly influenced by actions. These are the classical Flux architecture stores.
 - *tracking stores*: Tracking stores are lightweight wrappers around existing RxJS observables. Tracking stores exist
   to maintain store contracts and to expose the last emitted value for development tools.


### Creating a store

```javascript
import {createStore} from '@bripkens/rxstore';

const store = createStore({
  name: 'counter',

  getInitialState() {
    return 0;
  },

  onStart({increment, decrement}) {
    // called when the first subscriber subscribers
  },

  onStop({increment, decrement}) {
    // called when the last subscriber unsubscribes
  },

  actions: {
    increment(currentState, n = 1) {
      return currentState + n;
    },

    decrement(currentState, n = 1) {
      return currentState - n;
    }
  }
});

store.observable.subscribe(v => console.log(v));

store.actions.increment(3);
// logs: 3
store.actions.decrement(2);
// logs 2
```

### Creating a tracking store

```javascript
import {createTrackingStore} from '@bripkens/rxstore';

const store = createTrackingStore({
  name: 'current time',
  observable: Rx.Observable.interval(1000)
});

store.observable.subscribe(v => console.log(v));
```

### Handling uncaught errors

```javascript
import {setUncaughtErrorHandler} from '@bripkens/rxstore';

setUncaughtErrorHandler((location, error, state, actioName, args) => {
  // do something with this info
});
```
