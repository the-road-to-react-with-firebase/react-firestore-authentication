import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { styled } from '@material-ui/core/styles';

import IconButton from '@material-ui/core/IconButton';
import MyLocationIcon from '@material-ui/icons/MyLocation';
import SearchIcon from '@material-ui/icons/Search';
import EventIcon from '@material-ui/icons/Event';

import Modal from '@material-ui/core/Modal';
import Container from '@material-ui/core/Container';

import Search from '../Search';

import Filter from '../Filter';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import { GoogleMap, LoadScript, InfoWindow, Marker } from '@react-google-maps/api';

import { Spinner } from '../Loading';

import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';

const headerHeight = 48+20;
const SearchModal = styled(Modal)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  padding: 30,
});
const SearchModalContainer = styled(Container)({
  height: '90vh',
  padding: 30,
  backgroundColor: '#ffffff',
});
const FilterModal = styled(Modal)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  padding: 30,
});
const FilterModalContainer = styled(Container)({
  height: '90vh',
  padding: 30,
  backgroundColor: '#ffffff',
});
const ButtonLocate = styled(IconButton)({
  position: 'absolute',
  display: 'block',
  top: headerHeight+15,
  right: headerHeight+15,
  backgroundColor: '#ffffff',
  border: '2px solid #2699FB',
});
const ButtonSearch = styled(IconButton)({
  position: 'absolute',
  display: 'block',
  top: headerHeight+15,
  left: headerHeight+15,
  backgroundColor: '#ffffff',
  border: '2px solid #2699FB',
});
const ButtonFilter = styled(IconButton)({
  position: 'absolute',
  display: 'block',
  top: headerHeight+15,
  left: 'calc(50% - 26px)',
  backgroundColor: '#ffffff',
  border: '2px solid #2699FB',
});

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
  zoom: 10,
}

const timeNow = new Date();
const calendarDefaults = {
  startTime: timeNow,
  endTime: timeNow.addDays(7),
}

class GMap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      calendar: [],
      fullCalendar: [],
      loading: false,
      modalLoading: false,
      modalLoaded: false,
      modalOpen: false,
      filterModalLoaded: false,
      filterModalOpen: false,
      vendors: [],
      searchResults: [],
      locationLoading: false,
      infoLoading: false,
      infoTitle: null,
      selected: null,
      selectedVendor: null,
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
          fullCalendar: calendar,
          loading: false,
        });
      });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  filterCalendarByVendor(vendorId) {
    // Filters calendar events for a specific vendor
    function filterByID(item) {
      if (item.vendor === vendorId) {
        return true
      } 
      return false;
    }
    const result = this.state.fullCalendar.filter(filterByID);

    this.setState({
      calendar: result,
    });

    if(result.length === 1) {
      // Set selected marker to vendor if there is only one marker
      this.setSelected(result[0], this.state.mapRef)
    } else if (result.length > 1) {
      // Check for all vendor events at same location
      let locations = []

      for (var i = result.length - 1; i >= 0; i--) {
        let locationString = result[i].latitude + ',' + result[i].longitude;
        if(locations.indexOf(locationString) === -1) locations.push(locationString);
      }
      if(locations.length === 1) {
        // Set selected marker to vendor if there is only one location
        this.setSelected(result[0], this.state.mapRef)
      } else {
        // Multiple locations for the vendor; Don't set selected marker
        this.setSelected(null)
      }
    } else {
      alert('This vendor does not have any active events.');
    }

  }

  filterCalendarByTime(startDate, endDate, startTime, endTime) {
    // Filters calendar events for specific dates and/or hours
    let results = [];
    // Date filter
    if(startDate) {
    }
    // Hours filter
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
    });

    if(!this.state.modalLoaded) {
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
            modalLoaded: true,
          });
        });
    }
  }
  onModalClose = () => {
    this.modalUnsubscribe();
    this.setState({
      modalOpen: false,
    });
  }

  onFilterModalOpen = () => {
    this.setState({
      filterModalOpen: true,
    });
  }
  onFilterModalClose = () => {
    this.setState({
      filterModalOpen: false,
    });
  }


  setSelectedVendor = (selected) => {
    if(!selected || selected === '') {
      this.setState({
        calendar: this.state.fullCalendar,
        selected: null,
        selectedVendor: null,
      });
    } else {
      // Valid vendor selected
      this.onModalClose();
      this.setState({
        selected: null,
        selectedVendor: selected,
      });
      this.filterCalendarByVendor(selected.uid);
    }
  }

  render() {
    const {
      calendar,
      fullCalendar,
      modalLoading,
      modalLoaded,
      modalOpen,
      filterModalLoaded,
      filterModalOpen,
      vendors,
      searchResults,
      loading,
      locationLoading,
      infoLoading,
      infoTitle,
      selected,
      selectedVendor,
      mapRef
    } = this.state;

    return (
      <div>
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
        <ButtonLocate
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
          aria-label="Find my location"
        >
          {locationLoading  ? (
            <Spinner />
            ) : (
            <MyLocationIcon />
            )
          }
        </ButtonLocate>
        <ButtonSearch
          type="button"
          onClick={this.onModalOpen}
          aria-label="Search"
        >
          <SearchIcon />
        </ButtonSearch>
        <SearchModal
          open={modalOpen}
          onClose={this.onModalClose}
          aria-labelledby="modal-search-title"
          aria-describedby="modal-search-description"
        >
          <SearchModalContainer>
            <h2 id="modal-search-title">Search</h2>
            {modalLoading
              ? <Spinner />
              : (
                <div>
                  <p id="modal-search-description">
                    Search for a vendor
                  </p>
                  <Search
                    options={vendors} currentValue={selectedVendor} onChange={(value) => {this.setSelectedVendor(value)}} />
                </div>
                )
            }
            <button
              onClick={this.onModalClose}
            >
              Close
            </button>
          </SearchModalContainer>
        </SearchModal>
        <ButtonFilter
          type="button"
          onClick={this.onFilterModalOpen}
          aria-label="Search"
        >
          <EventIcon />
        </ButtonFilter>
        <FilterModal
          open={filterModalOpen}
          aria-labelledby="modal-filter-title"
          aria-describedby="modal-filter-description"
        >
          <FilterModalContainer>
              <h2 id="modal-filter-title">Filter</h2>
              <div>
                <p id="modal-filter-description">
                  Filter events
                </p>
                <Filter />
              </div>
              <button
                onClick={this.onFilterModalClose}
              >
                Close
              </button>
          </FilterModalContainer>
        </FilterModal>
      </div>
    )
  }
}

export default withFirebase(GMap);
