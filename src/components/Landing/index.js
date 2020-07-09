import React, { Component } from 'react';

import { GoogleMap, LoadScript, InfoWindow, Marker } from '@react-google-maps/api';

import { Switch, Route } from 'react-router-dom';
import { compose } from 'recompose';

import { VendorList, VendorItem } from '../Vendors';

import { withAuthorization, withEmailVerification } from '../Session';
import * as ROLES from '../../constants/roles';
import * as ROUTES from '../../constants/routes';


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

const onLoad = infoWindow => {
  //
}


class GMap extends Component {
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
            onClick={onLoad}
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

const Landing = () => (
  <div>
    <h1>Landing</h1>
    <GMap />
    <Switch>
      <Route exact path={ROUTES.VENDOR_DETAILS} component={VendorItem} />
      <Route exact path={ROUTES.LANDING} component={VendorList} />
    </Switch>
  </div>
);

export default Landing;
