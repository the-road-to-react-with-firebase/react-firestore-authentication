import React, { useState, useEffect, useRef } from 'react';

import { format, formatRelative } from 'date-fns';

import { withStyles } from '@material-ui/core/styles';

import { CalendarList } from '../Calendar';

import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';

import DirectionsIcon from '@material-ui/icons/Directions';
import PhoneIcon from '@material-ui/icons/Phone';
import LanguageIcon from '@material-ui/icons/Language';
import RestaurantMenuIcon from '@material-ui/icons/RestaurantMenu';
import ScheduleIcon from '@material-ui/icons/Schedule';
import EventIcon from '@material-ui/icons/Event';

import Dialog from '@material-ui/core/Dialog';
import Container from '@material-ui/core/Container';
import Toolbar from '@material-ui/core/Toolbar';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';

import FacebookIcon from '@material-ui/icons/Facebook';
import InstagramIcon from '@material-ui/icons/Instagram';

const Title = withStyles({
  root: {
    marginLeft: 4,
    textTransform: 'uppercase',
    fontWeight: 500,
    fontSize: '1.4rem',
    color: '#2699FB',
    textShadow: '1px 1px 2px #eee',
  },
})(Typography);

const CompactListItem = withStyles({
  root: {
    padding: '2px 4px',
  },
})(ListItem);

const CompactListItemIcon = withStyles({
  root: {
    minWidth: 32,
    marginTop: 5,
    color: '#2699FB',
  },
})(ListItemIcon);

const ListItemTextCenter = withStyles({
  root: {
    textAlign: 'center',
  },
})(ListItemText);

const SocialIconButton = withStyles({
  root: {
    color: '#2699FB',
  },
})(IconButton);

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function InfoWindow(props) {
  const observed = useRef(null);
  const [infoData, setInfoData] = useState(props.infoData);
  const [modalOpen, setModalOpen] = useState(false);
  const firebase = props.firebase;

  useEffect(() => {
    props.onRender((observed.current.clientHeight === 0) ? 300 : observed.current.clientHeight); // Todo: first render isn't firing correctly. Need to fix then remove this conditional statement
  }, [observed]);

  function openDirections(location) {
    firebase.analytics.logEvent('get_directions', {
      location_id: infoData.nextEvent.uid,
      location_address: infoData.nextEvent.address,
      vendor_id: infoData.nextEvent.vendor,
      vendor: infoData.title,
    });

    // Opens google maps directions in new window with specified location as the endpoint
    window.open('https://www.google.com/maps/dir/?api=1&destination='+location.latitude+','+location.longitude);
  }

  function callPhone(number) {
    firebase.analytics.logEvent('call_number', {
      location_id: infoData.nextEvent.uid,
      location_address: infoData.nextEvent.address,
      vendor_id: infoData.nextEvent.vendor,
      vendor: infoData.title,
      phone: number,
    });

    window.open('tel:' + number);
  }

  function openWebsite(link) {
    firebase.analytics.logEvent('view_website', {
      location_id: infoData.nextEvent.uid,
      location_address: infoData.nextEvent.address,
      vendor_id: infoData.nextEvent.vendor,
      vendor: infoData.title,
      website: link,
    });

    window.open(link);
  }

  function openMenu(link) {
    firebase.analytics.logEvent('view_menu', {
      location_id: infoData.nextEvent.uid,
      location_address: infoData.nextEvent.address,
      vendor_id: infoData.nextEvent.vendor,
      vendor: infoData.title,
      menu: link,
    });

    window.open(link);
  }

  function openSocial(platform, url) {
    firebase.analytics.logEvent(('visit_'+platform), {
      location_id: infoData.nextEvent.uid,
      location_address: infoData.nextEvent.address,
      vendor_id: infoData.nextEvent.vendor,
      vendor: infoData.title,
      url: url,
    });

    window.open(url);
  }

  return (
    <Container disableGutters ref={observed}>
      <Title variant="h5" component="h2">
        {infoData.title}
      </Title>
      <Grid container>
        <Grid item xs>
          <List>
            <CompactListItem alignItems={'flex-start'} key="address" button onClick={() => openDirections(infoData.events[0].location)}>
              <CompactListItemIcon>
                <DirectionsIcon />
              </CompactListItemIcon>
              <ListItemText primary={infoData.address} />
            </CompactListItem>
            {infoData.phone &&
              <CompactListItem alignItems={'flex-start'} key="phone" button onClick={() => callPhone(infoData.phone)}>
                <CompactListItemIcon>
                  <PhoneIcon />
                </CompactListItemIcon>
                <ListItemText primary={infoData.phone} />
              </CompactListItem>
            }
            {infoData.website &&
              <CompactListItem alignItems={'flex-start'} key="website" button onClick={() => openWebsite(infoData.website)}>
                <CompactListItemIcon>
                  <LanguageIcon />
                </CompactListItemIcon>
                <ListItemText primary={infoData.website} />
              </CompactListItem>
            }{infoData.menu &&
              <CompactListItem alignItems={'flex-start'} key="menu" button onClick={() => openMenu(infoData.menu)}>
                <CompactListItemIcon>
                  <RestaurantMenuIcon />
                </CompactListItemIcon>
                <ListItemText primary="View menu" />
              </CompactListItem>
            }
            <CompactListItem alignItems={'flex-start'} key="open">
              <CompactListItemIcon>
                <ScheduleIcon />
              </CompactListItemIcon>
              <ListItemText
                primary={infoData.isOpen ? 'Open now' : 'Closed'}
                secondary={(infoData.isOpen ? (format(infoData.nextEvent.start_time.toDate(), 'p') + format(infoData.nextEvent.end_time.toDate(), ' - p')) : ('Opens ' + formatRelative(infoData.nextEvent.start_time.toDate(), new Date()))) }
                className={infoData.isOpen ? 'text-open' : 'text-closed'}
              />
            </CompactListItem>
            <CompactListItem alignItems={'flex-start'} key="hours">
              <CompactListItemIcon>
                <EventIcon />
              </CompactListItemIcon>
              <ListItemText
                primary={infoData.nextEvent.recurring_start ? infoData.nextEvent.daysString : format(infoData.nextEvent.start_time.toDate(), 'EEEE, MMMM do')}
                secondaryTypographyProps={{component:'div'}}
                secondary={
                  <React.Fragment>
                    <div>
                    {
                      format(infoData.nextEvent.start_time.toDate(), 'p')+ format(infoData.nextEvent.end_time.toDate(), ' - p')
                    }
                    </div>
                    {infoData.nextEvent.additionalHours && (infoData.nextEvent.additionalHours.map((hour, index) => (
                      <div key={index}>{ format(hour.start_time.toDate(), 'p')+ format(hour.end_time.toDate(), ' - p') }</div>
                    )))}
                    {infoData.nextEvent.recurring_end && (infoData.nextEvent.recurring_end.toMillis() <= (new Date().getTime() + (7 * 24 * 60 * 60 * 1000))) && // recurring end date is within next 7 days
                      <div>
                        {'Through ' + format(infoData.nextEvent.recurring_end.toDate(), 'P')}
                      </div>
                    }
                  </React.Fragment>
                }
              />
            </CompactListItem>
          </List>
        </Grid>
        {(infoData.photo || infoData.instagram || infoData.facebook) &&
          <Grid item xs={4} style={{marginTop: 8, textAlign: 'center'}}>
            {infoData.photo &&
              <img src={infoData.photo} style={{width:'100%'}} />
            }
            <Grid container justify="space-evenly" spacing={1}>
              {infoData.instagram &&
                <Grid item xs>
                  <SocialIconButton size="small" onClick={() => openSocial('instagram', 'https://www.instagram.com/'+infoData.instagram)} aria-label="Instagram">
                    <InstagramIcon />
                  </SocialIconButton>
                </Grid>
              }
              {infoData.facebook &&
                <Grid item xs>
                  <SocialIconButton size="small" onClick={() => openSocial('facebook', 'https://www.facebook.com/'+infoData.facebook)} aria-label="Facebook">
                    <FacebookIcon />
                  </SocialIconButton>
                </Grid>
              }
            </Grid>
          </Grid>
        }
      </Grid>
      {infoData.events.length > 1 &&
        <List>
          <CompactListItem
            key="calendar"
            button
            onClick={() => setModalOpen(true)}>
              <ListItemTextCenter
                primary={(infoData.events.length-1) + ' other time' + ((infoData.events.length-1 === 1) ? '' : 's') + ' at this location'}
                secondary='View all dates and times'
              />
            </CompactListItem>
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
                    All dates and times at this location
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
        </List>
      }
    </Container>
  );
}
