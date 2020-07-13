import React from "react";
import { css } from "@emotion/core";
import ClipLoader from "react-spinners/ClipLoader";
 
const override = css`
  display: inline-block;
  border-color: red;
`;
 
export default class Spinner extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true
    };
  }
 
  render() {
    return (
      <div className="spinner">
        <ClipLoader
          css={override}
          size={24}
          color={"#000000"}
          loading={this.state.loading}
        />
      </div>
    );
  }
}