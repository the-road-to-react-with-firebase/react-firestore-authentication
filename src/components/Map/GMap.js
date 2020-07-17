import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { format, formatRelative } from 'date-fns';

import { styled } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';

import Popover from '@material-ui/core/Popover';

import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MyLocationIcon from '@material-ui/icons/MyLocation';
import SearchIcon from '@material-ui/icons/Search';
import EventIcon from '@material-ui/icons/Event';

import Typography from '@material-ui/core/Typography';

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
const headerButtonsHeight = headerHeight + 96;
const SearchModal = styled(Modal)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
});
const SearchModalContainer = styled(Container)({
  height: '100vh',
  padding: 30,
  backgroundColor: '#ffffff',
});
const FilterModal = styled(Modal)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
});
const FilterModalContainer = styled(Container)({
  height: '100vh',
  padding: 30,
  backgroundColor: '#ffffff',
});
const ButtonGrid = styled(Grid)({
  position: 'absolute',
  top: headerHeight+15,
  textAlign: 'center',
});
const RefreshPopover = styled(Popover)({
  margin: '0 auto',
});
const TopButton = styled(IconButton)({
  margin: '0 auto',
  display: 'block',
  backgroundColor: (props) =>
    props.selected
      ? '#2699FB'
      : '#ffffff',
  border: (props) =>
    props.selected
      ? '2px solid white'
      : '2px solid #2699FB',
  color: (props) =>
    props.selected
      ? 'white'
      : '#333333',
});
const ButtonText = styled(Typography)({
  color: (props) =>
    props.selected
      ? '#2699FB'
      : '#333333',
  fontWeight: 500,
  textShadow: '0 0 2px #ffffff, 0 0 5px #ffffff',
})

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
function getDayString(dayValue) {
  let weekday=new Array(7);
  weekday[0]="Sunday";
  weekday[1]="Monday";
  weekday[2]="Tuesday";
  weekday[3]="Wednesday";
  weekday[4]="Thursday";
  weekday[5]="Friday";
  weekday[6]="Saturday";

  return weekday[dayValue];
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
  options: {
    maxZoom: 18.5,
    mapTypeControl: false,
    gestureHandling: 'greedy',
  }
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
      infoData: {},
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
          this.setNewBounds(calendar);
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
      infoData: {},
      selected: null,
      selectedVendor: null,
    });
    this.setNewBounds(this.state.fullCalendar);
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

      this.setNewBounds(result);

      if(result.length === 1) {
        // Set selected marker to vendor if there is only one marker
        this.setSelected(result[0])
      } else if (result.length > 1) {
        // Check for all vendor events at same location
        let locations = []

        for (var i = result.length - 1; i >= 0; i--) {
          let locationString = result[i].latitude + ',' + result[i].longitude;
          if(locations.indexOf(locationString) === -1) locations.push(locationString);
        }
        if(locations.length === 1) {
          // Set selected marker to vendor if there is only one location
          this.setSelected(result[0])
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
      const endDateFilter = (!dates[1]) ? startDateFilter : new Date(dates[1].getTime());
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
    if(filteredResults.length === 1) this.setSelected(filteredResults[0]);
    
    this.setState({calendar: filteredResults});
    this.setNewBounds(filteredResults);
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

    if(event.recurring) {
      return event.days.includes(now.getDay());
    } else {
      return (now < event.end_time.toDate() && now > event.start_time.toDate());
    }
  }

  setNewBounds = (markers) => {
    // Sets map bounds to contain markers
    const bounds = new window.google.maps.LatLngBounds();
    var i = markers.length - 1;

    for (i; i >= 0; i--) {
      bounds.extend({lat: markers[i].location.latitude, lng: markers[i].location.longitude});
    }

    this.state.mapRef.fitBounds(bounds);
  }

  setSelected = (marker) => {
    if(marker) {
      this.setState({
        infoLoading: true,
      });
      this.state.mapRef.panTo({ lat: marker.location.latitude, lng: marker.location.longitude });
      this.state.mapRef.panBy(0, -headerButtonsHeight);

      // Load vendor details into infoWindow
      const vendor = this.props.firebase
        .vendor(marker.vendor)
        .onSnapshot(vendor => {
          let vendorEvents = this.getCalendarEventsAtLocation(marker.location);
          let nextEventDays = '';
          let firstDay = true;

          if(vendorEvents[0].recurring) {
            const today = new Date();
            const todayDay = today.getDay();
            const startDate = vendorEvents[0].start_time.toDate();
            const startHour = startDate.getHours();
            const startMinutes = startDate.getMinutes();
            const endDate = vendorEvents[0].end_time.toDate();
            const endHour = endDate.getHours();
            const endMinutes = endDate.getMinutes();
            let newStart = new Date();
            let newEnd = new Date();
            let checkDay = todayDay;
            let dateSet = false;

            // Set start_time and end_time of next recurring event (closest to today)
            // Go through event days array starting at index of todayDay
            do {
              let eventDay = (vendorEvents[0].days.indexOf(checkDay) != -1) ? vendorEvents[0].days[vendorEvents[0].days.indexOf(checkDay)] : null;

              if((eventDay === todayDay) && ((today.getHours() + today.getMinutes()*.01) < (endHour + endMinutes*.01))) {
                // Happening today and hasn't ended yet - keep newStart and newEnd value of today
                dateSet = true;
              } else if(todayDay < eventDay) {
                // If recurring day is greater than today, add days for new event dates
                newStart = newStart.addDays(eventDay - todayDay)
                newEnd = newEnd.addDays(eventDay - todayDay);
                dateSet = true;
              }
              checkDay++;
            } while(checkDay < 7 && !dateSet);
            if(!dateSet) {
              // If recurring day is less than today, add 7 - today day value + recurring day value for next event day
              newStart = newStart.addDays(7 - todayDay + vendorEvents[0].days[0]); // First recurring day in array is next event day
              newEnd = newEnd.addDays(7 - todayDay + vendorEvents[0].days[0]);
            }

            newStart.setHours(startHour);
            newStart.setMinutes(startMinutes);
            vendorEvents[0].start_time = new this.props.firebase.firestore.Timestamp.fromDate(newStart);
            newEnd.setHours(endHour);
            newEnd.setMinutes(endMinutes);
            vendorEvents[0].end_time = new this.props.firebase.firestore.Timestamp.fromDate(newEnd);
            // Create plain text recurring days string
            vendorEvents[0].days.map(day => {
              if(firstDay) {
                nextEventDays += getDayString(day) + 's';
                firstDay = false;
              } else {
                nextEventDays += ', ' + getDayString(day) + 's';
              }
            });
          }

          this.setState({
            selected: marker,
            infoLoading: false,
            infoData: {
              title: vendor.data().name,
              address: vendorEvents[0].address,
              phone: formatPhoneNumber(vendor.data().phone),
              isOpen: this.isOpen(vendorEvents[0]),
              nextEvent: vendorEvents[0],
              nextEventDays: nextEventDays,
              events: vendorEvents,
            }
          });
        }, err => {
          console.log('No such vendor!');
        });
    } else {
      this.setState({
        selected: null,
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
        } else {
          this.setNewBounds(this.state.calendar);
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
            options={mapOptions.options}
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
                  this.setSelected(spot);
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
                        <ListItem key="open">
                          <ListItemIcon>
                            <ScheduleIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={infoData.isOpen ? 'Open now' : 'Closed'}
                            secondary={(infoData.isOpen ? (format(infoData.nextEvent.start_time.toDate(), 'p') + format(infoData.nextEvent.end_time.toDate(), ' - p')) : ('Opens ' + formatRelative(infoData.nextEvent.start_time.toDate(), timeNow))) }
                            className={infoData.isOpen ? 'text-open' : 'text-closed'}
                          />
                        </ListItem>
                        <ListItem key="hours">
                          <ListItemIcon>
                            <EventIcon />
                          </ListItemIcon>
                          {infoData.nextEvent.recurring
                            ? 
                              <ListItemText
                                primary={infoData.nextEventDays}
                                secondary={ format(infoData.nextEvent.start_time.toDate(), 'p')+ format(infoData.nextEvent.end_time.toDate(), ' - p') }
                              />
                            :
                              <ListItemText
                                primary={ format(infoData.nextEvent.start_time.toDate(), 'EEEE, MMMM do') }
                                secondary={ format(infoData.nextEvent.start_time.toDate(), 'p')+ format(infoData.nextEvent.end_time.toDate(), ' - p') }
                              />
                          }
                        </ListItem>
                        {infoData.events.length > 1 &&
                          <ListItem key="calendar">
                            <ListItemIcon>
                            </ListItemIcon>
                            <ListItemText
                              primary={(infoData.events.length-1) + ' other event' + ((infoData.events.length-1 === 1) ? '' : 's') + ' at this location'}
                              secondary='View all dates and times'
                            />
                          </ListItem>
                        }
                      </List>
                    </div>
                  }
                </div>
              </InfoWindow>
            ) : null}
          </GoogleMap>
        </LoadScript>
        <ButtonGrid container spacing={3}>
          <Grid item xs={4} selected>
            <TopButton
              selected={selectedVendor}
              type="button"
              onClick={this.onModalOpen}
              aria-label="Search"
            >
              <SearchIcon />
            </TopButton>
            <ButtonText selected={selectedVendor}>
            {selectedVendor ? selectedVendor.name : 'Search Vendors' }
            </ButtonText>
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
            <TopButton
              selected={filterSet}
              type="button"
              onClick={this.onFilterModalOpen}
              aria-label="Search"
            >
              <EventIcon />
            </TopButton>
            <ButtonText selected={filterSet}>
            {filterSet ? 'Filter Applied' : 'Search Vendors' }
            </ButtonText>
            <FilterModal
              open={filterModalOpen}
              aria-labelledby="modal-filter-title"
            >
              <FilterModalContainer>
                  <h2 id="modal-filter-title">Filter</h2>
                  <div>
                    <Filter values={{filteredHours,filteredHoursToggle,filteredDates}} onChange={(hours, toggle, dates) => {this.setFilters(hours, toggle, dates)}}  />
                  </div>
              </FilterModalContainer>
            </FilterModal>
          </Grid>
          <Grid item xs={4}>
            <TopButton
              selected={locationLoading}
              onClick={() => {
                this.props.firebase.analytics.logEvent('location_detect');
                this.setState({
                  locationLoading: true,
                })
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const newZoom = mapOptions.zoom + 2;

                    this.props.firebase.analytics.logEvent('location_found', { position: position});
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
                    alert('We were unable to find your current location.');
                  }
                );
              }}
              aria-label="Find my location"
            >
              {locationLoading  ? (
                <Spinner color='#ffffff' />
                ) : (
                <MyLocationIcon />
                )
              }
            </TopButton>
            <ButtonText selected={locationLoading}>
            {locationLoading ? 'Finding Location...' : 'Find My Location' }
            </ButtonText>
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
