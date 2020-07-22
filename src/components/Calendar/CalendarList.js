import React from 'react';

import { format } from 'date-fns';

import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import EventIcon from '@material-ui/icons/Event';

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
  const [calendar, setCalendar] = React.useState(props.calendar);

  return (
    <List>
    {calendar.map((event) => (
      <ListItem alignItems="flex-start" key={event.uid}>
        <ListItemIcon>
          <EventIcon color="primary" />
        </ListItemIcon>
        <ListItemText
          primary={event.recurring_start ? event.daysString : format(event.start_time.toDate(), 'EEEE, MMMM do')}
          secondaryTypographyProps={{component:'div'}}
          secondary={
            <React.Fragment>
              <div>{ format(event.start_time.toDate(), 'p')+ format(event.end_time.toDate(), ' - p') }</div>
              {event.additionalHours && (event.additionalHours.map((hour, index) => (
                <div key={index}>{ format(hour.start_time.toDate(), 'p')+ format(hour.end_time.toDate(), ' - p') }</div>
              )))}
              {event.recurring_end && (event.recurring_end.toMillis() <= (new Date().getTime() + (7 * 24 * 60 * 60 * 1000))) && // recurring end date is within next 7 days
                <div>
                  {'Through ' + format(event.recurring_end.toDate(), 'P')}
                </div>
              }
            </React.Fragment>
          }
        />
      </ListItem>
    ))}
    </List>
  );
}
