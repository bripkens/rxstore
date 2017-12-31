/* eslint-disable space-before-function-paren */

import React from 'react';

// support usage with two and one parameters. This is done so that connectTo can be used
// easily with recompose and similar hocs.
//
// connectTo({…observables}, MyComponent);
// -and-
// connectTo({…observables})(MyComponent);
export function connectTo(createObservables, ComposedComponent) {
  if (arguments.length > 1) {
    return createConnectedComponent(createObservables, ComposedComponent);
  }

  // support
  return comp => createConnectedComponent(createObservables, comp);
}

// support an alternative name which follows the recompose naming strategy more
// closely.
export const connect = connectTo;

function createConnectedComponent(createObservables, ComposedComponent) {
  const needsToCreateObservablesWhenPropsChange = typeof createObservables === 'function';

  return class extends React.Component {
    static displayName = 'connectTo for ' + (ComposedComponent.displayName || ComposedComponent.name);

    state = {};
    subscriptions = new Map();
    observables = new Map();

    componentWillMount() {
      let observables;
      if (needsToCreateObservablesWhenPropsChange) {
        observables = createObservables(this.props);
      } else {
        observables = createObservables;
      }
      this.subscribe(observables);
    }

    componentWillReceiveProps(nextProps) {
      if (needsToCreateObservablesWhenPropsChange && !shallowEquals(this.props, nextProps)) {
        this.subscribe(createObservables(nextProps));
      }
    }

    subscribe(observables) {
      const newProperties = Object.keys(observables);
      const oldProperties = this.observables;

      for (let i = 0, length = newProperties.length; i < length; i++) {
        const property = newProperties[i];
        const prevObservable = this.observables.get(property);
        const newObservable = observables[property];

        if (prevObservable === newObservable) {
          // Nothing to do, we have the same observable
          continue;
        }

        const oldSubscription = this.subscriptions.get(property);
        this.observables.set(property, newObservable);
        this.subscriptions.set(property, newObservable.subscribe(this.onNewValue.bind(null, property)));

        // unsubscribe previous subscriptions only after new subscriptions were
        // established. This makes reference counting more efficient for
        // subscriptions which are immediately unsubscribed or for which
        // values are immediately recalculated.
        if (oldSubscription) {
          oldSubscription.unsubscribe();
        }
      }

      // Remove properties / subscriptions for all properties that haven't been
      // recreated / are not found in the new observable map.
      const removedProperties = [];
      oldProperties.forEach((property, key) => {
        if (!observables[key]) {
          removedProperties.push(key);
        }
      });

      const clearStateProps = {};
      for (let i = 0, len = removedProperties.length; i < len; i++) {
        const property = removedProperties[i];
        this.subscriptions.get(property).unsubscribe();
        this.subscriptions.delete(property);
        this.observables.delete(property);
        clearStateProps[property] = null;
      }
      this.setState(clearStateProps);
    }

    onNewValue = (property, value) => {
      this.setState({
        [property]: value
      });
    };

    componentWillUnmount() {
      this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    render() {
      return <ComposedComponent {...this.props} {...this.state} />;
    }
  };
}

function shallowEquals(a, b) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }

  for (let key in a) {
    if (a[key] !== b[key]) {
      return false;
    }
  }

  return true;
}
