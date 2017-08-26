const { Subject } = require('rxjs/Subject');
require('rxjs/add/operator/map');
const { stub } = require('sinon');

const { createStore, createTrackingStore, getStoreStates, setUncaughtErrorHandler } = require('..');

describe('stores', () => {
  let testObserver;

  beforeEach(() => {
    testObserver = createTestObserver();
  });

  afterEach(() => {
    setUncaughtErrorHandler(null); // reset to default
  });

  describe('createStore', () => {
    let counterStore;
    let onStart;
    let onStop;

    beforeEach(() => {
      onStart = stub();
      onStop = stub();
      incrementCalls = stub();
      decrementCalls = stub();
      counterStore = createCounterStore({ onStart, onStop, incrementCalls, decrementCalls });
    });

    test('initial state must emit immediately', () => {
      counterStore.observable.subscribe(testObserver);
      expect(testObserver.next.callCount).toEqual(1);
      expect(testObserver.next.getCall(0).args).toEqual([0]);
    });

    test('action sequences', () => {
      counterStore.observable.subscribe(testObserver);
      counterStore.actions.increment(3);
      counterStore.actions.decrement(2);
      expect(testObserver.next.callCount).toEqual(3);
      expect(testObserver.next.getCall(0).args).toEqual([0]);
      expect(testObserver.next.getCall(1).args).toEqual([3]);
      expect(testObserver.next.getCall(2).args).toEqual([1]);
    });

    test('call lifecycle handlers for a single subscriber', () => {
      expect(onStart.callCount).toEqual(0);
      expect(onStop.callCount).toEqual(0);
      const subscription = counterStore.observable.subscribe(testObserver);
      expect(onStart.callCount).toEqual(1);
      expect(onStop.callCount).toEqual(0);
      subscription.unsubscribe();
      expect(onStart.callCount).toEqual(1);
      expect(onStop.callCount).toEqual(1);
    });

    test('call lifecycle handlers for multiple subscribers', () => {
      const testObserver2 = createTestObserver();
      expect(onStart.callCount).toEqual(0);
      expect(onStop.callCount).toEqual(0);
      const subscription = counterStore.observable.subscribe(testObserver);
      expect(onStart.callCount).toEqual(1);
      expect(onStop.callCount).toEqual(0);
      const subscription2 = counterStore.observable.subscribe(testObserver2);
      expect(onStart.callCount).toEqual(1);
      expect(onStop.callCount).toEqual(0);
      subscription.unsubscribe();
      expect(onStart.callCount).toEqual(1);
      expect(onStop.callCount).toEqual(0);
      subscription2.unsubscribe();
      expect(onStart.callCount).toEqual(1);
      expect(onStop.callCount).toEqual(1);
    });

    test('restart lifecycle subscribers on new cycle', () => {
      let subscription = counterStore.observable.subscribe(testObserver);
      subscription.unsubscribe();
      expect(onStart.callCount).toEqual(1);
      expect(onStop.callCount).toEqual(1);
      subscription = counterStore.observable.subscribe(testObserver);
      expect(onStart.callCount).toEqual(2);
      expect(onStop.callCount).toEqual(1);
      subscription.unsubscribe();
      expect(onStart.callCount).toEqual(2);
      expect(onStop.callCount).toEqual(2);
    });

    test('expose state on global object for dev tools', () => {
      expect(getStoreStates()[counterStore.name]).toEqual(0);
      counterStore.actions.increment(3);
      expect(getStoreStates()[counterStore.name]).toEqual(3);
    });

    test('actions are not executed per subscriber', () => {
      counterStore.observable.subscribe(testObserver);
      counterStore.observable.subscribe(createTestObserver());
      counterStore.actions.increment(2);
      expect(incrementCalls.callCount).toEqual(1);
      expect(incrementCalls.getCall(0).args).toEqual([0, 2]);
    });

    test('do not emit when the value is unchanged', () => {
      counterStore.observable.subscribe(testObserver);
      expect(testObserver.next.callCount).toEqual(1);
      counterStore.actions.increment(0);
      expect(testObserver.next.callCount).toEqual(1);
      expect(testObserver.next.getCall(0).args).toEqual([0]);
    });

    describe('uncaught errors', () => {
      let onUncaughtError;

      beforeEach(() => {
        onUncaughtError = stub();
        setUncaughtErrorHandler(onUncaughtError);
      });

      test('report onStart uncaught error', () => {
        onStart.throws('on purpose error');
        counterStore.observable.subscribe(testObserver);
        expect(onUncaughtError.callCount).toEqual(1);
      });

      test('report onStop uncaught error', () => {
        onStop.throws('on purpose error');
        counterStore.observable.subscribe(testObserver).unsubscribe();
        expect(onUncaughtError.callCount).toEqual(1);
      });

      test('report action handler uncaught error', () => {
        incrementCalls.throws('on purpose error');
        counterStore.observable.subscribe(testObserver);
        expect(testObserver.next.callCount).toEqual(1);
        expect(testObserver.next.getCall(0).args).toEqual([0]);
        expect(onUncaughtError.callCount).toEqual(0);
        counterStore.actions.increment(2);
        expect(testObserver.next.callCount).toEqual(1);
        expect(onUncaughtError.callCount).toEqual(1);
      });
    });
  });

  describe('createTrackingStore', () => {
    let upstream$;
    let mapCalls;
    let store;

    beforeEach(() => {
      upstream$ = new Subject();
      mapCalls = stub();
      store = createTrackingStore({
        name: 'pwnd counter',
        observable: upstream$.map(v => {
          mapCalls(v);
          return Math.pow(v, 2);
        })
      });
    });

    test('pass through source observable', () => {
      store.observable.subscribe(testObserver);
      expect(testObserver.next.callCount).toEqual(0);
      upstream$.next(3);
      expect(testObserver.next.callCount).toEqual(1);
      expect(testObserver.next.getCall(0).args).toEqual([9]);
    });

    test('subsequent subscribers must get the last value without requiring recalculation', () => {
      store.observable.subscribe(testObserver);
      expect(mapCalls.callCount).toEqual(0);
      upstream$.next(3);
      expect(mapCalls.callCount).toEqual(1);
      const testObserver2 = createTestObserver();
      store.observable.subscribe(testObserver2);
      expect(testObserver.next.callCount).toEqual(1);
      expect(testObserver2.next.callCount).toEqual(1);
      expect(testObserver2.next.getCall(0).args).toEqual([9]);
      expect(mapCalls.callCount).toEqual(1);
    });

    test('expose value for dev tools', () => {
      store.observable.subscribe(testObserver);
      upstream$.next(3);
      expect(getStoreStates()[store.name]).toEqual(9);
    });
  });
});

function createTestObserver() {
  return {
    next: stub(),
    error: stub(),
    complete: stub()
  };
}

function createCounterStore({ onStart, onStop, incrementCalls = () => {}, decrementCalls = () => {} } = {}) {
  return createStore({
    name: 'counter',

    getInitialState() {
      return 0;
    },

    onStart,
    onStop,

    actions: {
      increment(currentState, n = 1) {
        incrementCalls(currentState, n);
        return currentState + n;
      },

      decrement(currentState, n = 1) {
        decrementCalls(currentState, n);
        return currentState - n;
      }
    }
  });
}
