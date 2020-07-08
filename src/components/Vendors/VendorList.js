import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';

class VendorList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      vendors: [],
    };
  }

  componentDidMount() {
    this.setState({ loading: true });

    this.unsubscribe = this.props.firebase
      .vendors()
      .onSnapshot(snapshot => {
        let vendors = [];

        snapshot.forEach(doc =>
          vendors.push({ ...doc.data(), uid: doc.id }),
        );

        this.setState({
          vendors,
          loading: false,
        });
      });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    const { vendors, loading } = this.state;

    return (
      <div>
        <h2>Vendors</h2>
        {loading && <div>Loading ...</div>}
        <ul>
          {vendors.map(vendor => (
            <li key={vendor.uid}>
              <span>
                <strong>ID:</strong> {vendor.uid}
              </span>
              <span>
                <strong>Name:</strong> {vendor.name}
              </span>
              <span>
                <Link
                  to={{
                    pathname: `${ROUTES.VENDOR}/${vendor.uid}`,
                    state: { vendor },
                  }}
                >
                  Details
                </Link>
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default withFirebase(VendorList);
