/* eslint-disable space-before-function-paren */

import React from 'react';

export default class PropsSetter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      props: props.props
    };
  }

  setProps(props) {
    this.setState({ props });
  }

  render() {
    const child = React.Children.only(this.props.children);
    return React.cloneElement(child, this.state.props);
  }
}
