/* eslint-env jest */

import {createStore} from '@bripkens/rxstore'
import renderer from 'react-test-renderer';
import {stub} from 'sinon';
import React from 'react';

import {connectTo} from '../src';

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
    counterStore = createCounterStore({onStart, onStop});
  });

  test('non-property relying connect', () => {
    const Component = connectTo({count: counterStore.observable}, ComposableComponent);
    const component = renderer.create(<Component/>);
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
});


function createComposableComponent(renderCalls) {
  return function ComposableComponent(props) {
    renderCalls(props);
    return (
      <div {...props}/>
    );
  }
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
