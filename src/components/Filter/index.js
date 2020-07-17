/* eslint-disable no-use-before-define */
import React from 'react';

// @material-ui/pickers
import DateFnsUtils from '@material-ui/pickers/adapter/date-fns';
import TextField from "@material-ui/core/TextField";
import { LocalizationProvider, StaticDateRangePicker, DateRangeDelimiter } from "@material-ui/pickers";

import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import Slider from '@material-ui/core/Slider';

import Button from '@material-ui/core/Button';

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
        <FormLabel id="hours" component="legend">Hours</FormLabel>
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
        <Slider
          value={hoursValue}
          min={0}
          step={1}
          max={24}
          onChange={handleChange}
          valueLabelDisplay="on"
          aria-labelledby="legend"
          valueLabelFormat={valuetext}
        />
      </FormControl>
      <hr />
      <FormControl>
        <FormLabel id="dates" component="legend">Days</FormLabel>
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
      <Button onClick={() => { returnFilters(hoursValue, time, selectedDate) }} fullWidth variant="contained" color="primary">
        Apply Filters
      </Button>
      <Button onClick={() => { returnFilters([0,24], 'any', [null,null]) }} fullWidth>
        Clear Filters
      </Button>
    </div>
  );
}