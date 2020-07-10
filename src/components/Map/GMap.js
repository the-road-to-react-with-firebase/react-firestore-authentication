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
      mapRef: null,
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

  setSelected(marker,map) {
    this.setState({
      selected: marker,
    });
    if(map) {
      map.panTo({ lat: marker.location.latitude, lng: marker.location.longitude })
    }
  }

  onMapLoad(map) {
    this.setState({
      mapRef: map,
    });
  }

  render() {
    const { calendar, loading, selected, mapRef } = this.state;


    return (
      <div>
        <button
          className="locate"
          onClick={() => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                mapRef.panTo({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                });
              },
              () => null
            );
          }}
        >Find My Location
        </button>
        <LoadScript
          googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API}
        >
          <GoogleMap
            id="Food-Finder-Map"
            mapContainerStyle={mapContainerStyle}
            zoom={11}
            center={center}
            onClick={() => {
              this.setSelected(null);
            }}
            onLoad={map => this.onMapLoad(map)}
          >
            {calendar.map((spot) => (
              <Marker
                key={spot.uid}
                position={{ lat: spot.location.latitude, lng: spot.location.longitude }}
                onClick={() => {
                  this.setSelected(spot,mapRef);
                }}
              />
            ))}
            {selected ? (
              <InfoWindow
                position={{ lat: 44.950575, lng: -93.320129 }}
                options={{pixelOffset: new window.google.maps.Size(0,-40)}}
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
      </div>
    )
  }
}

export default withFirebase(GMap);
