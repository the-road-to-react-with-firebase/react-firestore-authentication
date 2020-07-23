import React, { Component } from 'react';

import { styled } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';

import Popover from '@material-ui/core/Popover';

import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MyLocationIcon from '@material-ui/icons/MyLocation';
import SearchIcon from '@material-ui/icons/Search';
import EventIcon from '@material-ui/icons/Event';

import { InfoWindow as InfoWindowVendor } from '../Map';

import Typography from '@material-ui/core/Typography';

import Dialog from '@material-ui/core/Dialog';
import Container from '@material-ui/core/Container';
import Toolbar from '@material-ui/core/Toolbar';
import CloseIcon from '@material-ui/icons/Close';
import DoneIcon from '@material-ui/icons/Done';
import Slide from '@material-ui/core/Slide';

import Search from '../Search';
import FormControl from '@material-ui/core/FormControl';
import AppBar from '@material-ui/core/AppBar';

import Filter from '../Filter';

import Snackbar from '@material-ui/core/Snackbar';

import { GoogleMap, LoadScript, InfoWindow, Marker } from '@react-google-maps/api';

import { Spinner } from '../Loading';

import { withFirebase } from '../Firebase';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const headerHeight = 56;
const ButtonGrid = styled(Grid)({
  position: 'absolute',
  bottom: 8,
  textAlign: 'center',
});
const NavButton = styled(IconButton)({
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
      ? '#ffffff'
      : '#2699FB',
});
const ButtonText = styled(Typography)({
  color: (props) =>
    props.selected
      ? '#2699FB'
      : '#555555',
  fontWeight: 500,
  textShadow: '0 0 2px #ebf5fe, 0 0 10px #fff',
  lineHeight: 1.1,
});

const DialogContainer = styled(Container)({
  padding: '0 30px 120px',
});
const DialogToolbar = styled(Toolbar)({
  display: 'flex',
  justifyContent: 'space-between',
});

const ActionsBar = styled(AppBar)({
  top: 'auto',
  bottom: 0,
  padding: '10px 30px',
  backgroundColor: '#ffffff',
});
const Actions = styled(Button)({
  margin: '6px 0',
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
function getNextDate(recurringEvent, props) {
  // Determines the next date of a recurring event after the current date and time
  // Adds plain text days string (daysString) to returned object
  let recurringEventDays = '';
  let firstDay = true;

  const today = new Date();
  const todayDay = today.getDay();
  const startDate = recurringEvent.start_time.toDate();
  const startHour = startDate.getHours();
  const startMinutes = startDate.getMinutes();
  const endDate = recurringEvent.end_time.toDate();
  const endHour = endDate.getHours();
  const endMinutes = endDate.getMinutes();
  let newStart = new Date();
  let newEnd = new Date();
  let checkDay = todayDay;
  let dateSet = false;

  // Set start_time and end_time of next recurring event (closest to today)
  // Go through event days array starting at index of todayDay
  do {
    let eventDay = (recurringEvent.days.indexOf(checkDay) != -1) ? recurringEvent.days[recurringEvent.days.indexOf(checkDay)] : null;

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
    newStart = newStart.addDays(7 - todayDay + recurringEvent.days[0]); // First recurring day in array is next event day
    newEnd = newEnd.addDays(7 - todayDay + recurringEvent.days[0]);
  }

  newStart.setHours(startHour);
  newStart.setMinutes(startMinutes);
  recurringEvent.start_time = new props.firebase.firestore.Timestamp.fromDate(newStart);
  newEnd.setHours(endHour);
  newEnd.setMinutes(endMinutes);
  recurringEvent.end_time = new props.firebase.firestore.Timestamp.fromDate(newEnd);

  // Create plain text recurring days string
  recurringEvent.days.map(day => {
    if(firstDay) {
      recurringEventDays += getDayString(day) + 's';
      firstDay = false;
    } else {
      recurringEventDays += ', ' + getDayString(day) + 's';
    }
  });
  recurringEvent['daysString'] = recurringEventDays;

  return recurringEvent;
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
    top: headerHeight,
    height: 'calc(100vh - ' + headerHeight + 'px)',
    width: '100vw',
  },
  center: {
    lat: 44.9778,
    lng: -93.2650
  },
  zoom: 10,
  options: {
    disableDefaultUI: true,
    maxZoom: 18.5,
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
      // Todo: need to add some filters and limits if we get too many events
      .orderBy('start_time')
      .onSnapshot(snapshot => {
        let calendar = [];

        snapshot.forEach(event =>{
          const eventData = event.data();

          if(eventData.recurring_start) {
            if(eventData.recurring_end.toDate() > timeNow) calendar.push({ ...eventData, uid: event.id })
          } else if(eventData.end_time.toDate() > timeNow) calendar.push({ ...eventData, uid: event.id })
        });

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
        this.onModalClose();
        // Set selected marker to vendor if there is only one marker
        this.setSelected(result[0]);
      } else if (result.length > 1) {
        this.onModalClose();
        // Check for all vendor events at same location
        let locations = []
        let i = 0;

        for (i; i < result.length; i++) {
          let locationString = result[i].latitude + ',' + result[i].longitude;
          if(locations.indexOf(locationString) === -1) locations.push(locationString);
        }
        if(locations.length === 1) {
          // Set selected marker to vendor if there is only one location
          this.setSelected(result[0]);
        } else {
          // Multiple locations for the vendor; Don't set selected marker
          this.setSelected(null);
        }
      } else {
        alert('This vendor does not have any active events.');
      }
    }

  }

  filterCalendarByTime = (dates, hours) => {
    // Filters calendar events for specific dates and/or hours
    let dateResults = [];
    let hourResults = [];
    const currentCalendar = this.state.selectedVendor ? this.state.vendorFilteredCalendar : this.state.fullCalendar;

    // Date filter
    if(dates[0]) {
      let i = 0;
      const startDateFilter = new Date(dates[0].getTime());
      const endDateFilter = (!dates[1]) ? startDateFilter : new Date(dates[1].getTime());
      const filterDays = getDaysInRange(startDateFilter, endDateFilter);

      for (i; i < currentCalendar.length; i++) {
        if(currentCalendar[i].recurring_start) {
          // Check if some of event days are within filter range
          if(
            ((currentCalendar[i].recurring_start.toDate() >= startDateFilter) && (currentCalendar[i].recurring_start.toDate() <= endDateFilter)) ||
            ((currentCalendar[i].recurring_end.toDate() >=startDateFilter) && (currentCalendar[i].recurring_end.toDate() <= endDateFilter))) {
              // Filter recurring events by the days of the week selected in the date filter
              let r = 0;
              
              for (r; r < currentCalendar[i].days.length; r++) {
                if(filterDays.includes(currentCalendar[i].days[r])) {
                  dateResults.push(currentCalendar[i]);
                  r = currentCalendar[i].days.length;
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

      for (i; i < tempCalendar.length; i++) {
        const currentEvent = tempCalendar[i];
        const currentStartHour = currentEvent.start_time.toDate().getHours();
        const currentEndHour = currentEvent.end_time.toDate().getHours();

        if(hours[0] < currentEndHour && hours[1] > currentStartHour) {
          hourResults.push(currentEvent);
        } else if(currentEvent.additionalHours) {
          // Check for additionalHours for this event
          const additionalHours = currentEvent.additionalHours;
          let a = 0;

          for (a; a < additionalHours.length; a++) {
            const currentStartHour = additionalHours[a].start_time.toDate().getHours();
            const currentEndHour = additionalHours[a].end_time.toDate().getHours();

            if(hours[0] < currentEndHour && hours[1] > currentStartHour) {
              hourResults.push(currentEvent);
            }
          }
        }
      }
    } else {
      hourResults = dateResults;
    }

    if(hourResults.length === 0) {
      alert('No events found matching your search.');
      if(this.state.selectedVendor) {
        // Vendor search + filter applied
      }
    } else {
      if(this.state.modalOpen) this.onModalClose();
      if(this.state.filterModalOpen) this.onFilterModalClose();

      
      // Check for all vendor events at same location
      let locations = []
      let i = 0;
      for (i; i < hourResults.length; i++) {
        let locationString = hourResults[i].latitude + ',' + hourResults[i].longitude;
        if(locations.indexOf(locationString) === -1) locations.push(locationString);
      }
      if(locations.length === 1 && hourResults.length === 1) {
        // Set selected marker  if there is only one location and filtered result
        this.setSelected(hourResults[0]);
      }
    }
    
    
    this.setState({calendar: hourResults});
    this.setNewBounds(hourResults);
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

  isOpen = (event) => {
    let now = new Date();

    if(event.recurring_start) {
      return event.days.includes(now.getDay());
    } else {
      return (now < event.end_time.toDate() && now > event.start_time.toDate());
    }
  }

  setNewBounds = (markers, padding) => {
    padding = padding || {};
    // Sets map bounds to contain markers
    const bounds = new window.google.maps.LatLngBounds();
    var i = markers.length - 1;

    for (i; i >= 0; i--) {
      bounds.extend({lat: markers[i].location.latitude, lng: markers[i].location.longitude});
    }

    this.state.mapRef.fitBounds(bounds, padding);
  }

  setPan = (offset) => {
    this.state.mapRef.panBy(0, offset);
  }

  setSelected = (marker) => {
    if(marker) {
      this.setState({
        infoLoading: true,
      });

      // Load vendor details into infoWindow
      const vendor = this.props.firebase
        .vendor(marker.vendor)
        .onSnapshot(vendor => {
          let vendorEvents = this.getCalendarEventsAtLocation(marker.location);

          if(vendorEvents[0].recurring_start) {
            // If next event is recurring then we need to calculate updated start_time for all recurring events to display correct order by date
            for (var i = vendorEvents.length - 1; i >= 0; i--) {
              if(vendorEvents[i].recurring_start) vendorEvents[i] = getNextDate(vendorEvents[i], this.props);
            }
            vendorEvents.sort((a, b) => (a.start_time > b.start_time) ? 1 : -1);
          }

          this.setState({
            selected: marker,
            infoLoading: false,
            infoData: {
              title: vendor.data().name,
              address: vendorEvents[0].address,
              phone: formatPhoneNumber(vendor.data().phone),
              website: vendor.data().website,
              menu: vendor.data().menu,
              isOpen: this.isOpen(vendorEvents[0]),
              nextEvent: vendorEvents[0],
              events: vendorEvents,
              photo: vendor.data().photo,
              facebook: vendor.data().facebook,
              instagram: vendor.data().instagram,
            }
          });

          this.props.firebase.analytics.logEvent('marker_selected', {
            location_id: marker.uid,
            location_address: vendorEvents[0].address,
            vendor_id: marker.vendor,
            vendor: vendor.data().name,
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
      this.props.firebase.analytics.logEvent('filter_cleared');
    } else {
      this.props.firebase.analytics.logEvent('filter_applied', {
        start_hour: hours[0],
        end_hour: hours[1],
        start_date: dates[0],
        end_date: dates[1],
      });
    }
    this.setState({
      filteredHours: hours,
      filteredHoursToggle: toggle,
      filteredDates: dates,
      filterSet: filterStatus,
      selected: null,
    });
    this.filterCalendarByTime(dates, hours);
  }

  setSelectedVendor = (selected, cleared) => {
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
          if(cleared) {
            this.onModalClose();
            this.setNewBounds(this.state.calendar);

            this.props.firebase.analytics.logEvent('search_cleared');
          }
        }
      });

      this.props.firebase.analytics.logEvent('search_cleared');
    } else {
      if(typeof selected === 'string') {
        alert('Vendor not found. Please select vendor from list.')
      } else {
        // Valid vendor selected
        this.setState({
          selected: null,
          selectedVendor: selected,
        }, () => this.filterCalendarByVendor(selected.uid));

        this.props.firebase.analytics.logEvent('search_vendor', { vendor_id: selected.uid, vendor: selected.name });

      }
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
      mapRef,
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
              if(selected){
                this.setSelected(null);
              }
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
                {infoLoading
                  ? <Spinner />
                  : <InfoWindowVendor
                      infoData={infoData}
                      firebase={this.props.firebase}
                      onRender={(height) => { this.setPan(height) }}
                    />
                }
              </InfoWindow>
            ) : null}
          </GoogleMap>
        </LoadScript>
        <ButtonGrid container spacing={2}>
          <Grid item xs={4} selected>
            <NavButton
              selected={selectedVendor}
              type="button"
              onClick={this.onModalOpen}
              aria-label="Search"
            >
              <SearchIcon />
            </NavButton>
            <ButtonText selected={selectedVendor}>
            {selectedVendor ? selectedVendor.name : 'Search Vendors' }
            </ButtonText>
            <Dialog
              fullScreen
              open={modalOpen}
              onClose={this.onModalClose}
              aria-labelledby="modal-search-title"
              aria-describedby="modal-search-description"
              TransitionComponent={Transition}
            >
              <DialogToolbar>
                <IconButton edge="start" color="inherit" onClick={() => { this.setSelectedVendor(null, true) }} aria-label="clear search">
                  <CloseIcon />
                </IconButton>
                <Typography variant="h6" id="modal-search-title">
                  Vendor Search
                </Typography>
                <IconButton edge="end" color="inherit" onClick={this.onModalClose} aria-label="close search">
                  <DoneIcon />
                </IconButton>
              </DialogToolbar>
              {modalLoading
                ? <Spinner />
                : (
                  <DialogContainer>
                    <FormControl fullWidth>
                      <p id="modal-search-description">
                        Search for a vendor by name
                      </p>
                      <Search
                        options={vendors} currentValue={selectedVendor} onChange={(value) => {this.setSelectedVendor(value)}} />
                    </FormControl>
                    <ActionsBar position="fixed" color="primary">
                      <Actions onClick={this.onModalClose} fullWidth variant="contained" color="primary">
                        Find Vendor
                      </Actions>
                      <Actions onClick={() => { this.setSelectedVendor(null, true) }} fullWidth>
                        Clear Search
                      </Actions>
                    </ActionsBar>
                  </DialogContainer>
                  )
              }
            </Dialog>
          </Grid>
          <Grid item xs={4}>
            <NavButton
              selected={filterSet}
              type="button"
              onClick={this.onFilterModalOpen}
              aria-label="Filter by day or time"
            >
              <EventIcon />
            </NavButton>
            <ButtonText selected={filterSet}>
            {filterSet ? 'Filter Applied' : 'Filter by Day or Time' }
            </ButtonText>
            <Dialog
              fullScreen
              open={filterModalOpen}
              onClose={this.onFilterModalClose}
              aria-labelledby="modal-filter-title"
              TransitionComponent={Transition}
            >
              <Filter values={{filteredHours,filteredHoursToggle,filteredDates}} onChange={(hours, toggle, dates) => {this.setFilters(hours, toggle, dates)}}  />
            </Dialog>
          </Grid>
          <Grid item xs={4}>
            <NavButton
              selected={locationLoading}
              onClick={() => {
                this.props.firebase.analytics.logEvent('location_detect');
                this.setState({
                  locationLoading: true,
                })
                navigator.geolocation.getCurrentPosition(
                  (position) => {

                    this.props.firebase.analytics.logEvent('location_found', { position: position});
                    this.setState({
                      locationLoading: false,
                    });
                    mapRef.panTo({
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                    });
                    mapRef.setZoom(12);
                  },
                  () => {
                    this.setState({
                      locationLoading: false,
                    })
                    alert('Unable to find your current location.');
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
            </NavButton>
            <ButtonText selected={locationLoading}>
            {locationLoading ? 'Finding Location' : 'Find My Location' }
            </ButtonText>
          </Grid>
          <Snackbar
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            open={refresh}
            message="Map updated. Please refresh to see latest info."
            action={
              <React.Fragment>
                <Button color="secondary" size="small" onClick={this.refreshMap}>
                  Refresh Map
                </Button>
              </React.Fragment>
            }
          />
        </ButtonGrid>
      </div>
    )
  }
}

export default withFirebase(GMap);
