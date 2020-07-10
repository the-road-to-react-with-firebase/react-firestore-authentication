import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { GoogleMap, LoadScript, InfoWindow, Marker } from '@react-google-maps/api';

import { Spinner } from '../Loading';

import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

const mapOptions = {
  mapContainerStyle : {
    height: '100vh',
    width: '100vw',
  },
  center: {
    lat: 44.9778,
    lng: -93.2650
  },
  zoom: 11,
}

const timeNow = new Date();
const calendarDefaults = {
  startTime: timeNow,
  endTime: timeNow.addDays(7),
}

function filterCalendarByTime(startTime, endTime) {
  // Filters calendar events between time period and removes duplicates

}

class GMap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      calendar: [],
      loading: false,
      selected: null,
      mapRef: null,
      locationLoading: false,
    };
  }

  componentDidMount() {
    this.setState({ loading: true });

    this.unsubscribe = this.props.firebase
      .calendar()
      .where('end_time', '>', timeNow) // only adding calendar events that haven't ended before right now
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
    const { calendar, loading, locationLoading, selected, mapRef } = this.state;

    return (
      <div>
        <button
          className="locate"
          onClick={() => {
            this.setState({
              locationLoading: true,
            })
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const newZoom = mapOptions.zoom + 2;
                this.setState({
                  locationLoading: false,
                });
                mapRef.panTo({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                });
                mapRef.setZoom(newZoom);
              },
              () => {
                this.setState({
                  locationLoading: false,
                })
                alert('We were unable to find your current location. Please try searching for a location.');
              }
            );
          }}
        >
          Find My Location
          {locationLoading &&
            <Spinner />
          }
        </button>
        <LoadScript
          googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API}
        >
          <GoogleMap
            id="Food-Finder-Map"
            mapContainerStyle={mapOptions.mapContainerStyle}
            zoom={mapOptions.zoom}
            center={mapOptions.center}
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
                position={{ lat: selected.location.latitude, lng: selected.location.longitude }}
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
