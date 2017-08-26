const {Subject} = require('rxjs/Subject');
const {ReplaySubject} = require('rxjs/ReplaySubject');
const {Observable} = require('rxjs/Observable');
require('rxjs/add/operator/distinctUntilChanged');
require('rxjs/add/operator/do');
require('rxjs/add/operator/merge');
require('rxjs/add/operator/multicast');
require('rxjs/add/operator/scan');

const noop = () => {};
const storeStates = {};

exports.getStoreStates = () => storeStates;

let onUncaughtError = (location, e, state, actioName, args) => {
  if (typeof console === 'undefined') {
    return;
  }

  if (arguments.length === 2) {
    console.error('Unhandled error in %s.', location, 'Error:', e);
  } else {
    console.error('Unhandled error in %s', location, 'Error:', e, 'Previous State:', state, 'Action name:', actioName, 'Action args:', args);
  }
};
exports.setUncaughtErrorHandler = _onUncaughtError => onUncaughtError = _onUncaughtError;

exports.createStore = ({name, actions, onStart=noop, onStop=noop, getInitialState}) => {
  const triggers$ = new Subject();

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
      try {
        return actions[actionName].apply(null, args);
      } catch (e) {
        onUncaughtError('state transition', e, state, actioName, args);
        return state;
      }
    }, getInitialState())
    .merge(
      // multicast source observable to implement start/stop
      Observable.create(_observer => {
        try {
          onStart(exposedActions);
        } catch (e) {
          onUncaughtError('onStart', e);
        }
        return () => {
          try {
            onStop(exposedActions);
          } catch (e) {
            onUncaughtError('onStop', e);
          }
        };
      }))
    .multicast(new ReplaySubject(1))
    .refCount()
    .distinctUntilChanged()
    .do(v => storeStates[name] = v);

  return {
    observable: exposedObservable$,
    actions: exposedActions
  };
}
