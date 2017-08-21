const Rx = require('rxjs/Rx');

const noop = () => {};

exports.createStore = function createStore({name, actions, onStart=noop, onStop=noop, getInitialState}) {
  const triggers$ = new Rx.Subject();

  const exposedActions = Object.keys(actions)
    .reduce((reducedExposedActions, actionName) => {
      const actionHandler = actions[actionName];
      reducedExposedActions[actionName] = function(...args) {
        triggers$.next({
          actionName,
          args
        });
      };
      return reducedExposedActions;
    }, {});

  const exposedObservable$ = triggers$
    .scan((state, {actionName, args}) => {
      args = args.slice();
      args.unshift(state);
      return actions[actionName].apply(null, args);
    }, getInitialState())
    .merge(
      // multicast source observable to implement start/stop
      Rx.Observable.create(_observer => {
        onStart(exposedActions);
        return () => onStop(exposedActions);
      }))
    .multicast(new Rx.ReplaySubject(1))
    .refCount()
    .distinctUntilChanged();

  return {
    observable: exposedObservable$,
    actions: exposedActions
  };
}
