import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';

import { GoogleMap, LoadScript, InfoWindow, Marker } from '@react-google-maps/api';

import { Spinner } from '../Loading';

import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';

const useStyles = makeStyles((theme) => ({
  paper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: '#ffffff',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

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

function filterCalendarByVendor(vendor) {
  // Filters calendar events for a specific vendor

}

class GMap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      classes: useStyles,
      calendar: [],
      loading: false,
      modalLoading: false,
      modalOpen: false,
      vendors: [],
      searchResults: [],
      locationLoading: false,
      infoLoading: false,
      infoTitle: null,
      selected: null,
      mapRef: null,
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
      infoLoading: true,
    });
    if(marker) {
      if(map) {
        map.panTo({ lat: marker.location.latitude, lng: marker.location.longitude })
      }

      // Load vendor details into infoWindow
      const vendor = this.props.firebase
        .vendor(marker.vendor)
        .onSnapshot(vendor => {
          this.setState({
            infoLoading: false,
            infoTitle: vendor.data().name,
          });
        }, err => {
          console.log('No such vendor!');
        });
    }
  }

  onMapLoad = (map) => {
    this.setState({
      mapRef: map,
    });
  }

  onModalOpen = () => {
    this.setState({
      modalOpen: true,
    })
    this.setState({ modalLoading: true });

    this.modalUnsubscribe = this.props.firebase
      .vendors()
      .onSnapshot(vendorsList => {
        let vendors = [];

        vendorsList.forEach(doc =>
          vendors.push({ ...doc.data(), uid: doc.id }),
        );

        this.setState({
          vendors,
          modalLoading: false,
        });
      });
  }
  onModalClose = () => {
    this.modalUnsubscribe();
    this.setState({
      modalOpen: false,
    });
  }

  onSearchInput = (event) => {
    const query = event.target.value.toLowerCase();
    let matches = new Set();

    if(query !== '') {
      this.state.vendors.find(vendor => {
        if(vendor.name.toLowerCase().search(query) !== -1) {
          matches.add(vendor);
        }
      });
    }
    this.setState({searchResults: Array.from(matches)});
  }

  render() {
    const {
      classes,
      calendar,
      modalLoading,
      modalOpen,
      vendors,
      searchResults,
      loading,
      locationLoading,
      infoLoading,
      infoTitle,
      selected,
      mapRef
    } = this.state;

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
        <div>
          <button type="button" onClick={this.onModalOpen}>
            Open Modal
          </button>
          <Modal
            open={modalOpen}
            onClose={this.onModalClose}
            aria-labelledby="simple-modal-title"
            aria-describedby="simple-modal-description"
          >
            <div className={classes.paper}>
                <h2 id="simple-modal-title">Search</h2>
                {modalLoading
                  ? <Spinner />
                  : (
                    <div>
                      <p id="simple-modal-description">
                        Search by location or vendor name
                      </p>
                      <FormControl fullWidth>
                        <TextField id="search-input" label="Location or vendor" variant="outlined" onChange={this.onSearchInput} />
                      </FormControl>
                      <ul>
                        {searchResults.map(searchResult => (
                          <li key={searchResult.uid}>
                            {searchResult.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                    )
              }
              <button
                onClick={this.onModalClose}
              >
                Close
              </button>
            </div>
          </Modal>
        </div>
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
                  {infoLoading
                    ? <Spinner />
                    :
                      <h2>
                        {infoTitle}
                      </h2>
                  }
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
