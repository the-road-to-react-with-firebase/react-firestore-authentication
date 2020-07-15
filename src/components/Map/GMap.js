import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { styled } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';

import Popover from '@material-ui/core/Popover';

import Button from '@material-ui/core/Button';
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
import ListItemIcon from '@material-ui/core/ListItemIcon';

import DirectionsIcon from '@material-ui/icons/Directions';
import PhoneIcon from '@material-ui/icons/Phone';
import ScheduleIcon from '@material-ui/icons/Schedule';

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
const ButtonGrid = styled(Grid)({
  position: 'absolute',
  top: headerHeight+15,
  textAlign: 'center',
})
const RefreshPopover = styled(Popover)({
  margin: '0 auto',
})
const ButtonLocate = styled(IconButton)({
  margin: '0 auto',
  display: 'block',
  backgroundColor: '#ffffff',
  border: '2px solid #2699FB',
});
const ButtonSearch = styled(IconButton)({
  margin: '0 auto',
  display: 'block',
  backgroundColor: '#ffffff',
  border: '2px solid #2699FB',
});
const ButtonFilter = styled(IconButton)({
  margin: '0 auto',
  display: 'block',
  backgroundColor: '#ffffff',
  border: '2px solid #2699FB',
});

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}
function getDaysInRange(startDate, endDate) {
  let days = [];
  let i = 0;
  const daysSelected = ((endDate - startDate) / 1000/60/60/24);

  if(daysSelected >= 7) days = [0,1,2,3,4,5,6];
  else if(daysSelected <= 1) days = [startDate.getDay()]
  else {
    do {
      days.push(startDate.addDays(i).getDay());
      i++;
    }
    while (i <= daysSelected);
  }

  return days;
}

function formatPhoneNumber(phoneNumberString) {
  var cleaned = ('' + phoneNumberString).replace(/\D/g, '')
  var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return null
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
      refresh: false,
      modalLoading: false,
      modalLoaded: false,
      modalOpen: false,
      filterModalOpen: false,
      filterSet: false,
      filteredHours: [0,24],
      filteredHoursToggle: 'any',
      filteredDates: [null,null],
      vendors: [],
      vendorFilteredCalendar: [],
      searchResults: [],
      locationLoading: false,
      infoLoading: false,
      infoData: {
        events: [],
        title: null,
        address: null,
        phone: null,
        website: null,
        menu: null,
        instagram: null,
        facebook: null,
      },
      selected: null,
      selectedVendor: null,
      mapRef: null,
    };
  }

  componentDidMount() {
    this.setState({ loading: true });

    this.unsubscribe = this.props.firebase
      .calendar()
      .orderBy('end_time')
      .where('end_time', '>', timeNow) // only adding calendar events that haven't ended before right now
      .onSnapshot(snapshot => {
        let calendar = [];

        snapshot.forEach(doc =>
          calendar.push({ ...doc.data(), uid: doc.id }),
        );

        if(this.state.loading) {
          this.setState({
            calendar,
            fullCalendar: calendar,
            loading: false,
          });
        } else {
          this.setState({
            refresh: true,
            fullCalendar: calendar,
          });
        }

      });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  refreshMap = () => {
    this.setState({
      calendar: this.state.fullCalendar,
      refresh: false,
      filterSet: false,
      filteredHours: [0,24],
      filteredHoursToggle: 'any',
      filteredDates: [null,null],
      modalLoaded: false,
      vendors: [],
      vendorFilteredCalendar: [],
      searchResults: [],
      infoLoading: false,
      infoData: {
        events: [],
        title: null,
        address: null,
        phone: null,
        website: null,
        menu: null,
        instagram: null,
        facebook: null,
      },
      selected: null,
      selectedVendor: null,
    });
    this.state.mapRef.panTo(mapOptions.center)
    this.state.mapRef.setZoom(mapOptions.zoom);
  }

  filterCalendarByVendor = (vendorId) => {
    // Filters calendar events for a specific vendor
    function filterByID(item) {
      if (item.vendor === vendorId) {
        return true
      } 
      return false;
    }
    const result = this.state.fullCalendar.filter(filterByID);

    if(this.state.filteredDates[0] || (this.state.filteredHours[0] !== 0 && this.state.filteredHours[1] !== 24)) {
      this.setState({
        vendorFilteredCalendar: result,
      }, () => this.filterCalendarByTime(this.state.filteredDates, this.state.filteredHours)); // Rerun date filters
    } else {
      this.setState({
        calendar: result,
        vendorFilteredCalendar: result,
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

  }

  filterCalendarByTime = (dates, hours) => {
    // Filters calendar events for specific dates and/or hours
    let dateResults = [];
    let filteredResults = [];
    const currentCalendar = this.state.selectedVendor ? this.state.vendorFilteredCalendar : this.state.fullCalendar;

    // Date filter
    if(dates[0]) {
      let i = 0;
      const startDateFilter = new Date(dates[0].getTime());
      const endDateFilter = (!endDateFilter) ? startDateFilter : new Date(dates[1].getTime());
      const filterDays = getDaysInRange(startDateFilter, endDateFilter);
      for (i = currentCalendar.length - 1; i >= 0; i--) {
        if(currentCalendar[i].recurring) {
          // Check if some of event days are within filter range
          if(
            ((currentCalendar[i].recurring_start.toDate() >= startDateFilter) && (currentCalendar[i].recurring_start.toDate() <= endDateFilter)) ||
            ((currentCalendar[i].recurring_end.toDate() >=startDateFilter) && (currentCalendar[i].recurring_end.toDate() <= endDateFilter))) {
              // Filter recurring events by the days of the week selected in the date filter
              let r = 0;
              
              for (r = currentCalendar[i].days.length - 1; r >= 0; r--) {
                if(filterDays.includes(currentCalendar[i].days[r])) {
                  dateResults.push(currentCalendar[i]);
                  r = -1;
                } 
              }
          }
        } else {
           if(startDateFilter <= currentCalendar[i].end_time.toDate() && endDateFilter >= currentCalendar[i].start_time.toDate().addDays(-1)) {
            dateResults.push(currentCalendar[i]);
          }
        }
      }
    } else {
      dateResults = currentCalendar;
    }

    // Hours filter
    if(hours) {
      const tempCalendar = dateResults;
      let i = 0;

      for (i = tempCalendar.length - 1; i >= 0; i--) {
        const currentStartHour = tempCalendar[i].start_time.toDate().getHours();
        const currentEndHour = tempCalendar[i].end_time.toDate().getHours();

        if(hours[0] < currentEndHour && hours[1] > currentStartHour) {
          filteredResults.push(tempCalendar[i]);
        }
      }
    } else {
      filteredResults = dateResults;
    }

    if(filteredResults.length === 0) alert('No events found matching your search.');
    
    this.setState({calendar: filteredResults});
  }

  getCalendarEventsAtLocation = (location) => {
    function filterByLocation(item) {
      if (item.location.latitude === location.latitude && item.location.longitude === location.longitude) {
        return true
      } 
      return false;
    }
    // Using current calendar with vendor search and fitlers applied
    return this.state.calendar.filter(filterByLocation);
  }

  openDirections = (location) => {
    // Opens google maps directions in new window with specified location as the endpoint
    window.open('https://www.google.com/maps/dir/?api=1&destination='+location.latitude+','+location.longitude);
  }

  isOpen = (event) => {
    let now = new Date();
    return (now < event.end_time.toDate() && now > event.start_time.toDate());
  }

  setSelected = (marker, map) => {
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
          let vendorEvents = this.getCalendarEventsAtLocation(marker.location);

          this.setState({
            infoLoading: false,
            infoData: {
              title: vendor.data().name,
              address: vendorEvents[0].address,
              phone: formatPhoneNumber(vendor.data().phone),
              isOpen: this.isOpen(vendorEvents[0]),
              events: vendorEvents,
            }
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

      const vendorsFirestore = this.props.firebase
        .vendors()
        .orderBy('name')
        .get()
        .then(vendorsList => {
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

  setFilters = (hours, toggle, dates) => {
    let filterStatus = false;
    if(dates[0] || (hours[0] !== 0 && hours[1] !== 24)) {
      filterStatus = true;
    }
    this.filterCalendarByTime(dates, hours);
    this.setState({
      filteredHours: hours,
      filteredHoursToggle: toggle,
      filteredDates: dates,
      filterSet: filterStatus,
      selected: null,
    });
    this.onFilterModalClose();
  }

  setSelectedVendor = (selected) => {
    if(!selected || selected === '') {
      this.setState({
        calendar: this.state.fullCalendar,
        vendorFilteredCalendar: [],
        selected: null,
        selectedVendor: null,
      }, () => {
        if(this.state.filteredDates[0] || (this.state.filteredHours[0] !== 0 && this.state.filteredHours[1] !== 24)) {
          // Rerun date filters
          this.filterCalendarByTime(this.state.filteredDates, this.state.filteredHours);
        }
      });
    } else {
      // Valid vendor selected
      this.setState({
        selected: null,
        selectedVendor: selected,
      }, () => this.filterCalendarByVendor(selected.uid));

      this.onModalClose();
    }
  }

  render() {
    const {
      calendar,
      fullCalendar,
      refresh,
      modalLoading,
      modalLoaded,
      modalOpen,
      filterModalOpen,
      filteredHoursToggle,
      filteredHours,
      filteredDates,
      filterSet,
      vendors,
      searchResults,
      loading,
      locationLoading,
      infoLoading,
      infoData,
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
                onCloseClick={() => {
                  this.setSelected(null);
                }}
              >
                <div>
                  {infoLoading
                    ? <Spinner />
                    :
                    <div>
                      <h2>
                        {infoData.title}
                      </h2>
                      <List>
                        <ListItem key="address" button onClick={() => this.openDirections(infoData.events[0].location)}>
                          <ListItemIcon>
                            <DirectionsIcon />
                          </ListItemIcon>
                          <ListItemText primary={infoData.address} />
                        </ListItem>
                        {infoData.phone &&
                          <ListItem key="phone" button onClick={() => window.open('tel:' + infoData.phone)}>
                            <ListItemIcon>
                              <PhoneIcon />
                            </ListItemIcon>
                            <ListItemText primary={infoData.phone} />
                          </ListItem>
                        }

                          <ListItem key="hours">
                            <ListItemIcon>
                              <ScheduleIcon />
                            </ListItemIcon>
                            <ListItemText primary={infoData.isOpen ? 'Open now' : 'Closed'} />
                          </ListItem>
                      </List>
                      {infoData.events.map((calEvent) => (

                        <div key={calEvent.uid}>{calEvent.uid}</div>

                      ))}
                    </div>
                  }
                </div>
              </InfoWindow>
            ) : null}
          </GoogleMap>
        </LoadScript>
        <ButtonGrid container spacing={3}>
          <Grid item xs={4}>
            <ButtonSearch
              type="button"
              onClick={this.onModalOpen}
              aria-label="Search"
            >
              <SearchIcon />
            </ButtonSearch>
            {selectedVendor
              ?
                <span>{selectedVendor.name}</span>
              :
                <span>Search Vendors</span>
            }
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
                      <Button onClick={this.onModalClose} fullWidth variant="contained" color="primary">
                        Find Vendor
                      </Button>
                      <Button onClick={() => {this.onModalClose(); this.setSelectedVendor(null);} } fullWidth>
                        Clear Search
                      </Button>
                    </div>
                    )
                }
              </SearchModalContainer>
            </SearchModal>
          </Grid>
          <Grid item xs={4}>
            <ButtonFilter
              type="button"
              onClick={this.onFilterModalOpen}
              aria-label="Search"
            >
              <EventIcon />
            </ButtonFilter>

            {filterSet
              ?
                <span>Filter applied</span>
              :
                <span>Filter by Date or Time</span>
            }
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
                    <Filter values={{filteredHours,filteredHoursToggle,filteredDates}} onChange={(hours, toggle, dates) => {this.setFilters(hours, toggle, dates)}}  />
                  </div>
              </FilterModalContainer>
            </FilterModal>
          </Grid>
          <Grid item xs={4}>
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
            Find My Location
          </Grid>
          {refresh &&
            <Grid item xs={12}>
              <Button onClick={this.refreshMap}>
                Events Updated. Refresh map
              </Button>
            </Grid>
          }
          
        </ButtonGrid>
      </div>
    )
  }
}

export default withFirebase(GMap);
