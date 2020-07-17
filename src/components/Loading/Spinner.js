import React from "react";
import ClipLoader from "react-spinners/ClipLoader";
 
export default class Spinner extends React.Component {
  constructor(props) {
    super(props);

    const color = props.color ? props.color : '#000000'

    this.state = {
      loading: true,
      color: color,
    };
  }
 
  render() {
    return (
      <ClipLoader
        size={24}
        color={this.state.color}
        loading={this.state.loading}
      />
    );
  }
}