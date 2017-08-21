const Rx = require('rxjs/Rx');

const noop = () => {};

exports.createRefCountingObservable = function createRefCountingObservable({onStart=noop, onStop=noop}) {
  let observer;
  let result;
  const source = Rx.Observable.create(_observer => {
    observer = _observer;
    onStart(result);

    return () => {
      observer = null;
      onStop(result);
    };
  });

  result = {
    next() {
      if (observer) {
        observer.next.apply(observer, arguments);
      }
    },

    error() {
      if (observer) {
        observer.error.apply(observer, arguments);
      }
    },

    complete() {
      if (observer) {
        observer.complete.apply(observer, arguments);
      }
    },

    exposedObservable: source
      .multicast(new Rx.ReplaySubject(1))
      .refCount()
  };

  return result;
}
