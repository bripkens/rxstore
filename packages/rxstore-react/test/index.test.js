/* eslint-disable space-before-function-paren */
/* eslint-env jest */

import { createStore } from '@bripkens/rxstore';
import renderer from 'react-test-renderer';
import { stub } from 'sinon';
import React from 'react';

import PropSetter from './PropSetter';
import { connectTo } from '../src';

describe('connectTo', () => {
  let onStart;
  let onStop;
  let counterStore;
  let render;
  let ComposableComponent;

  beforeEach(() => {
    render = stub();
    onStart = stub();
    onStop = stub();
    ComposableComponent = createComposableComponent(render);
    counterStore = createCounterStore({ onStart, onStop });
  });

  test('static connect', () => {
    const Component = connectTo({ count: counterStore.observable }, ComposableComponent);
    const component = renderer.create(<Component />);
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
    expect(render.callCount).toEqual(1);

    counterStore.actions.increment(3);
    tree = component.toJSON();
    expect(tree).toMatchSnapshot();
    expect(render.callCount).toEqual(2);
    expect(onStart.callCount).toEqual(1);
    expect(onStop.callCount).toEqual(0);
  });

  test('property depending', () => {
    const Component = connectTo(props => {
      return {
        count: counterStore.observable.scan((agg, v) => agg.concat([v]), [props.n])
      };
    }, ComposableComponent);
    const component = renderer.create(<Component n={5} />);
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();

    counterStore.actions.increment(3);
    tree = component.toJSON();
    expect(tree).toMatchSnapshot();
    expect(render.callCount).toEqual(2);
    expect(onStart.callCount).toEqual(1);
    expect(onStop.callCount).toEqual(0);
  });

  test('property updates must recalculate observables', () => {
    let connectCalculations = stub();
    const Component = connectTo(props => {
      connectCalculations(props);
      return {
        count: counterStore.observable.scan((agg, v) => agg.concat([v]), [props.n])
      };
    }, ComposableComponent);
    const component = renderer.create(
      <PropSetter props={{ n: 5 }}>
        <Component />
      </PropSetter>
    );
    expect(component.toJSON()).toMatchSnapshot();
    expect(connectCalculations.callCount).toEqual(1);
    component.getInstance().setProps({ n: 3 });
    expect(component.toJSON()).toMatchSnapshot();
    expect(connectCalculations.callCount).toEqual(2);
  });
});

function createComposableComponent(renderCalls) {
  return function ComposableComponent(props) {
    renderCalls(props);
    return <div {...props} />;
  };
}

function createCounterStore({ onStart, onStop } = {}) {
  return createStore({
    name: 'counter',

    getInitialState() {
      return 0;
    },

    onStart,
    onStop,

    actions: {
      increment(currentState, n = 1) {
        return currentState + n;
      },

      decrement(currentState, n = 1) {
        return currentState - n;
      }
    }
  });
}
