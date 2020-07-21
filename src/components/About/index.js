import React, { useEffect } from 'react';

export default function About(props) {

  useEffect(() => {
    document.title = 'About | Fair Food Finder';
  });

  return (
    <div>
      <h1>About</h1>
      <p>Future content for the about page will go here.</p>
    </div>
  );
};