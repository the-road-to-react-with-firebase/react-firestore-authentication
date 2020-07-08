import React, { Component } from 'react';

import { withFirebase } from '../Firebase';

class VendorItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      vendor: null,
      ...props.location.state,
    };
  }

  componentDidMount() {
    if (this.state.vendor) {
      return;
    }

    this.setState({ loading: true });

    this.unsubscribe = this.props.firebase
      .vendor(this.props.match.params.id)
      .onSnapshot(snapshot => {
        this.setState({
          vendor: snapshot.data(),
          loading: false,
        });
      });
  }

  componentWillUnmount() {
    this.unsubscribe && this.unsubscribe();
  }

  render() {
    const { vendor, loading } = this.state;

    return (
      <div>
        <h1>Vendor Details</h1>
        <h2>Vendor ({this.props.match.params.id})</h2>
        {loading && <div>Loading ...</div>}

        {vendor && (
          <div>
            <span>
              <strong>ID:</strong> {vendor.uid}
            </span>
            <span>
              <strong>Name:</strong> {vendor.name}
            </span>
            <span>
              <strong>Phone:</strong> {vendor.phone}
            </span>
          </div>
        )}
      </div>
    );
  }
}

export default withFirebase(VendorItem);
