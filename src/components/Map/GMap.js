import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { GoogleMap, LoadScript, InfoWindow, Marker } from '@react-google-maps/api';

import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';

// const [selectedVendor, setSelectedVendor] = useState(null);

const mapContainerStyle = {
  height: '100vh',
  width: '100vw',
}

const center = {
  lat: 44.9778,
  lng: -93.2650
}

const position = { lat: 44.9422948, lng: -93.3288194 }

const divStyle = {
  background: `white`,
  border: `1px solid #ccc`,
  padding: 15
}

class GMap extends Component {
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
    return (
      <LoadScript
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API}
      >
        <GoogleMap
          id="Food-Finder-Map"
          mapContainerStyle={mapContainerStyle}
          zoom={11}
          center={center}
        >
          <Marker
            // onClick={setSelectedVendor}
            position={position}
          >
            
              <InfoWindow
                position={position}
              >
                <div style={divStyle}>
                  <h1>InfoWindow</h1>
                </div>
              </InfoWindow>
          </Marker>

        </GoogleMap>
      </LoadScript>
    )
  }
}

export default withFirebase(GMap);
