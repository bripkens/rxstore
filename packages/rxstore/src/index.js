/* eslint-disable space-before-function-paren */

const { ReplaySubject } = require('rxjs/ReplaySubject');
const { Observable } = require('rxjs/Observable');
require('rxjs/add/operator/distinctUntilChanged');
require('rxjs/add/operator/multicast');
require('rxjs/add/operator/merge');
require('rxjs/add/operator/scan');
require('rxjs/add/operator/do');

const noop = () => {};

const storeStates = {};
exports.getStoreStates = () => storeStates;

let onUncaughtError = defaultUncaughtErrorHandler;
exports.setUncaughtErrorHandler = _onUncaughtError =>
  (onUncaughtError = _onUncaughtError || defaultUncaughtErrorHandler);
function defaultUncaughtErrorHandler(location, e, state, actioName, args) {
  if (typeof console === 'undefined') {
    return;
  }

  if (arguments.length === 2) {
    console.error('Unhandled error in', location, 'Error:', e);
  } else {
    console.error(
      'Unhandled error in',
      location,
      'Error:',
      e,
      'Previous State:',
      state,
      'Action name:',
      actioName,
      'Action args:',
      args
    );
  }
}

exports.createStore = ({ name, actions, onStart = noop, onStop = noop, getInitialState }) => {
  const state$ = new ReplaySubject(1);
  let state = (storeStates[name] = getInitialState());
  state$.next(state);

  const exposedActions = Object.keys(actions).reduce((reducedExposedActions, actionName) => {
    reducedExposedActions[actionName] = (...args) => {
      args = args.slice();
      args.unshift(state);
      try {
        const nextState = actions[actionName].apply(null, args);
        if (nextState !== state) {
          state = storeStates[name] = nextState;
          state$.next(nextState);
        }
      } catch (e) {
        onUncaughtError('state transition', e, state, actionName, args);
      }
    };
    return reducedExposedActions;
  }, {});

  const exposedObservable$ = state$
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
      })
    )
    .multicast(new ReplaySubject(1))
    .refCount();

  return {
    name,
    observable: exposedObservable$,
    actions: exposedActions
  };
};

exports.createTrackingStore = ({ name, observable }) => {
  return {
    name,
    observable: observable
      .distinctUntilChanged()
      .do(v => (storeStates[name] = v))
      .multicast(new ReplaySubject(1))
      .refCount()
  };
};
