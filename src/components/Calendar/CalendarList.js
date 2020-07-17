import React from 'react';

import { format } from 'date-fns';

import { makeStyles, useTheme } from '@material-ui/core/styles';

import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import EventIcon from '@material-ui/icons/Event';

const useStyles = makeStyles((theme) => ({
  root: {
  },
}));

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
function getDaysString(days) {
  // Create plain text recurring days string
  let firstDay = true;
  let daysString = '';

  days.map(day => {
    if(firstDay) {
      daysString += getDayString(day) + 's';
      firstDay = false;
    } else {
      daysString += ', ' + getDayString(day) + 's';
    }
  });

  return daysString;
}

export default function CalendarList(props) {
  const classes = useStyles();
  const theme = useTheme();
  const [calendar, setCalendar] = React.useState(props.calendar);
  console.log(calendar);

  return (
    <List className={classes.root}>
    {calendar.map((event) => (
      <ListItem key={event.uid}>
        <ListItemIcon>
          <EventIcon />
        </ListItemIcon>
        {event.recurring
          ? 
            <ListItemText
              primary={getDaysString(event.days)}
              secondary={ format(event.start_time.toDate(), 'p')+ format(event.end_time.toDate(), ' - p') }
            />
          :
            <ListItemText
              primary={ format(event.start_time.toDate(), 'EEEE, MMMM do') }
              secondary={ format(event.start_time.toDate(), 'p')+ format(event.end_time.toDate(), ' - p') }
            />
        }
      </ListItem>
    ))}
    </List>
  );
}
