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
      calendar: [],
      loading: false,
      selected: null,
    };
  }

  componentDidMount() {
    this.setState({ loading: true });

    this.unsubscribe = this.props.firebase
      .calendar()
      .onSnapshot(snapshot => {
        let calendar = [];

        snapshot.forEach(doc =>
          calendar.push({ ...doc.data(), uid: doc.id }),
        );

        this.setState({
          calendar,
          loading: false,
        });
      });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  setSelected(marker) {
    this.setState({
      selected: marker,
    });
  }

  render() {
    const { calendar, loading, selected } = this.state;

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
          {calendar.map((spot) => (
            <Marker
              key={spot.uid}
              position={{ lat: spot.location.latitude, lng: spot.location.longitude }}
              onClick={() => {
                this.setSelected(spot);
              }}
            />
          ))}
          {selected ? (
            <InfoWindow
            position={{ lat: 44.950575, lng: -93.320129 }}
            onCloseClick ={() => {
              this.setSelected(null);
            }}
          >
              <div>
                <h2>
                  test
                </h2>
              </div>
            </InfoWindow>
          ) : null}
        </GoogleMap>
      </LoadScript>
    )
  }
}

export default withFirebase(GMap);
