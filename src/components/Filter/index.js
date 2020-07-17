/* eslint-disable no-use-before-define */
import React from 'react';

import PropTypes from 'prop-types';

import { withStyles, makeStyles } from '@material-ui/core/styles';

// @material-ui/pickers
import DateFnsUtils from '@material-ui/pickers/adapter/date-fns';
import TextField from "@material-ui/core/TextField";
import { LocalizationProvider, StaticDateRangePicker, DateRangeDelimiter } from "@material-ui/pickers";

import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ScheduleIcon from '@material-ui/icons/Schedule';
import EventIcon from '@material-ui/icons/Event';

import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import Slider from '@material-ui/core/Slider';
import ValueLabel from "@material-ui/core/Slider/ValueLabel";

import Button from '@material-ui/core/Button';

const Label = withStyles({
  root: {
    paddingLeft: 0,
    marginBottom: 5,
    marginTop: 0,
  },
})(ListItem);
const LabelIcon = withStyles({
  root: {
    minWidth: 30,  
  },
})(ListItemIcon);

const StyledValueLabel = withStyles({
  circle: {
    width: 40,
    height: 40,
  },
  label: {
    color: '#ffffff',
  }
})(ValueLabel);

const HoursSlider = withStyles({
  root: {
    height: 6,
    margin: '50px 20px',
  },
  thumb: {
    height: 24,
    width: 24,
    backgroundColor: '#fff',
    border: '2px solid currentColor',
    marginTop: -8,
    marginLeft: -12,
    '&:focus, &:hover, &$active': {
      boxShadow: 'inherit',
    },
  },
  active: {},
  valueLabel: {
    left: -10,
    top: -40,
  },
  track: {
    height: 8,
    borderRadius: 4,
  },
  rail: {
    height: 8,
    borderRadius: 4,
  },
})(Slider);

const Actions = withStyles({
  root: {
    margin: '8px 0',
  },
})(Button);

function valuetext(value) {
  let postText = 'AM';

  if(value === 0) {
    value = 12;
  } else if(value === 12) {
    postText = 'PM';
  } else if(value > 12) {
    value = value - 12;
    if(value < 24) postText = 'PM';
  }

  return `${value} ${postText}`;
}

export default function CalendarFilter(props) {
  const values = props.values;
  const [hoursValue, setHoursValue] = React.useState(values.filteredHours);
  const [time, setTime] = React.useState(values.filteredHoursToggle);
  const [selectedDate, handleDateChange] = React.useState(values.filteredDates);

  const returnFilters = (hours, toggle, dates) => {
    props.onChange(hours, toggle, dates);
  }

  const handleToggle = (event, newTime) => {
    let newValue = [0,0];

    if(newTime === 'any') {
      newValue = [0,24];
    } else if(newTime === 'breakfast') {
      newValue = [5,11];
    } else if(newTime === 'lunch') {
      newValue = [11,15];
    } else if(newTime === 'dinner') {
      newValue = [16,22];
    }

    setTime(newTime);
    setHoursValue(newValue);
  };

  const handleChange = (event, newValue) => {
    setTime(null);
    setHoursValue(newValue);
  };

  return (
    <div>
      <FormControl>
        <Label component="h3">
          <LabelIcon>
            <ScheduleIcon />
          </LabelIcon>
          <ListItemText primary="Hours" />
        </Label>
        <ToggleButtonGroup
          value={time}
          exclusive
          onChange={handleToggle}
          aria-label="select time"
        >
          <ToggleButton value='any' aria-label="left aligned">
            Anytime
          </ToggleButton>
          <ToggleButton value='breakfast' aria-label="centered">
            Breakfast
          </ToggleButton>
          <ToggleButton value='lunch' aria-label="right aligned">
            Lunch
          </ToggleButton>
          <ToggleButton value='dinner' aria-label="justified">
            Dinner
          </ToggleButton>
        </ToggleButtonGroup>
        <HoursSlider
          value={hoursValue}
          min={0}
          step={1}
          max={24}
          onChange={handleChange}
          valueLabelDisplay="on"
          ValueLabelComponent={StyledValueLabel}
          valueLabelFormat={valuetext}
        />
        <Label component="h3">
          <LabelIcon>
            <EventIcon />
          </LabelIcon>
          <ListItemText primary="Days" />
        </Label>
        <LocalizationProvider dateAdapter={DateFnsUtils}>
          <StaticDateRangePicker
            disablePast
            showToolbar={false}
            displayStaticWrapperAs="mobile"
            value={selectedDate}
            onChange={date => handleDateChange(date)}
            renderInput={(startProps, endProps) => (
              <React.Fragment>
                <TextField {...startProps} />
                <DateRangeDelimiter> to </DateRangeDelimiter>
                <TextField {...endProps} />
              </React.Fragment>
            )}
          />
        </LocalizationProvider>
      </FormControl>
      <Actions onClick={() => { returnFilters(hoursValue, time, selectedDate) }} fullWidth variant="contained" color="primary">
        Apply Filters
      </Actions>
      <Actions onClick={() => { returnFilters([0,24], 'any', [null,null]) }} fullWidth>
        Clear Filters
      </Actions>
    </div>
  );
}