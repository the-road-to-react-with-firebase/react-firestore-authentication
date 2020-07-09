import React, { Component } from 'react';

import { Switch, Route } from 'react-router-dom';
import { compose } from 'recompose';

import { GMap } from '../Map';
import { VendorList, VendorItem } from '../Vendors';

import { withAuthorization, withEmailVerification } from '../Session';
import * as ROLES from '../../constants/roles';
import * as ROUTES from '../../constants/routes';


const Landing = () => (
  <div>
    <h1>Landing</h1>
    <GMap />
    <Switch>
      <Route exact path={ROUTES.VENDOR_DETAILS} component={VendorItem} />
      <Route exact path={ROUTES.LANDING} component={VendorList} />
    </Switch>
  </div>
);

export default Landing;
