/* eslint-disable no-use-before-define */
import React from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';

export default function VendorSearch(props) {
  const options = props.options;
  const [value, setValue] = React.useState(props.currentValue);

  function handleChange(event, newValue) {
    setValue(newValue);
    props.onChange(newValue);
  }
  function handleInputChange(event, newValue) {
    // Handle input clear
    if(newValue === ''){
      setValue(newValue);
      props.onChange(newValue);
    }
  }

  return (
    <Autocomplete
      freeSolo
      open
      id="search"
      fullWidth={true}
      options={options}
      noOptionsText='No vendors found'
      getOptionLabel={option => option.name}
      value={value}
      onChange={handleChange}
      onInputChange={handleInputChange}
      renderInput={(params) => (
        <TextField {...params} label="Search vendors" variant="outlined" margin="normal" />
      )}
      renderOption={(option, { inputValue }) => {
        const matches = match(option.name, inputValue);
        const parts = parse(option.name, matches);

        return (
          <div>
            {parts.map((part, index) => (
              <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                {part.text}
              </span>
            ))}
          </div>
        );
      }}
    />
  );
}