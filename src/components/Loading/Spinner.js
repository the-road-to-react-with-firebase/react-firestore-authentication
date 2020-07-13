import React from "react";
import ClipLoader from "react-spinners/ClipLoader";
 
export default class Spinner extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true
    };
  }
 
  render() {
    return (
      <ClipLoader
        size={24}
        color={"#000000"}
        loading={this.state.loading}
      />
    );
  }
}