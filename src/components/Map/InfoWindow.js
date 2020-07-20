import React, { useState, useEffect, useRef } from 'react';

import { format, formatRelative } from 'date-fns';

import { CalendarList } from '../Calendar';

import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';

import DirectionsIcon from '@material-ui/icons/Directions';
import PhoneIcon from '@material-ui/icons/Phone';
import ScheduleIcon from '@material-ui/icons/Schedule';
import EventIcon from '@material-ui/icons/Event';

import Dialog from '@material-ui/core/Dialog';
import Container from '@material-ui/core/Container';
import Toolbar from '@material-ui/core/Toolbar';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function InfoWindow(props) {
  const observed = useRef(null);
  const [infoData, setInfoData] = useState(props.infoData);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    props.onRender((observed.current.clientHeight === 0) ? 300 : observed.current.clientHeight); // Todo: first render isn't firing correctly. Need to fix then remove this conditional statement
  }, [observed]);

  function openDirections(location) {
    // Opens google maps directions in new window with specified location as the endpoint
    window.open('https://www.google.com/maps/dir/?api=1&destination='+location.latitude+','+location.longitude);
  }

  return (
    <div ref={observed}>
      <Typography variant="h5" component="h2">
        {infoData.title}
      </Typography>
      <List>
        <ListItem key="address" button onClick={() => openDirections(infoData.events[0].location)}>
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
            secondary={(infoData.isOpen ? (format(infoData.nextEvent.start_time.toDate(), 'p') + format(infoData.nextEvent.end_time.toDate(), ' - p')) : ('Opens ' + formatRelative(infoData.nextEvent.start_time.toDate(), new Date()))) }
            className={infoData.isOpen ? 'text-open' : 'text-closed'}
          />
        </ListItem>
        <ListItem key="hours">
          <ListItemIcon>
            <EventIcon />
          </ListItemIcon>
          <ListItemText
            primary={infoData.nextEvent.recurring ? infoData.nextEvent.daysString : format(infoData.nextEvent.start_time.toDate(), 'EEEE, MMMM do')}
            secondaryTypographyProps={{component:'div'}}
            secondary={
              <React.Fragment>
                <div>{ format(infoData.nextEvent.start_time.toDate(), 'p')+ format(infoData.nextEvent.end_time.toDate(), ' - p') }</div>
                {infoData.nextEvent.additionalHours && (infoData.nextEvent.additionalHours.map((hour, index) => (
                  <div key={index}>{ format(hour.start_time.toDate(), 'p')+ format(hour.end_time.toDate(), ' - p') }</div>
                )))}
              </React.Fragment>
            }
          />
        </ListItem>
        {infoData.events.length > 1 &&
          <div>
            <ListItem
              key="calendar"
              button
              onClick={() => setModalOpen(true)}>
                <ListItemText
                  inset
                  primary={(infoData.events.length-1) + ' other event' + ((infoData.events.length-1 === 1) ? '' : 's') + ' at this location'}
                  secondary='View all dates and times'
                />
              </ListItem>
              <Dialog
                fullScreen
                open={modalOpen}
                TransitionComponent={Transition}
                aria-labelledby="modal-calendar-title"
              >
                <Container>
                  <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={() => setModalOpen(false)} aria-label="close">
                      <CloseIcon />
                    </IconButton>
                    <Typography variant="h6" id="modal-calendar-title">
                      All events at this location
                    </Typography>
                  </Toolbar>
                  <CalendarList calendar={infoData.events} />
                  <Button
                    onClick={() => setModalOpen(false)}
                    fullWidth>
                    Back to Map
                  </Button>
                </Container>
              </Dialog>
          </div>
        }
      </List>
    </div>
  );
}
