/* eslint-disable space-before-function-paren, quotes */

import {connectTo} from '@bripkens/rxstore-react';
import {createStore} from '@bripkens/rxstore';
import ReactDOM from 'react-dom';
import React from 'react';

const counterStore = createStore({
  name: 'counter',

  getInitialState() {
    return 0;
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

const App = connectTo({counterValue: counterStore.observable}, ({counterValue}) => {
  return (
    <div>
      <button type='button' onClick={() => counterStore.actions.decrement(1)}>-</button>
      {counterValue}
      <button type='button' onClick={() => counterStore.actions.increment(1)}>+</button>
    </div>
  );
});

ReactDOM.render(<App />, document.getElementById('root'));
