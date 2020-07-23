import React from 'react';
import clsx from 'clsx';
import { BrowserRouter as Router, Link } from 'react-router-dom';

import { AuthUserContext } from '../Session';
import SignOutButton from '../SignOut';
import * as ROUTES from '../../constants/routes';
import * as ROLES from '../../constants/roles';

import FoodFinderLogo from '../SVG/food-finder-logo.svg';

import { makeStyles, useTheme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import CloseIcon from '@material-ui/icons/Close';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import RoomIcon from '@material-ui/icons/Room';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    backgroundColor: 'rgba(235, 245, 254, 1)',
    boxShadow: 'none',
  },
  title: {
    margin: '0 auto',
    '-webkit-filter': 'drop-shadow( 1px 1px 0px #fff)',
    filter: 'drop-shadow( 1px 1px 0px #fff)',
  },
  menuButton: {
    left: theme.spacing(2),
    position: 'absolute',
    color: '#2699FB',
    '-webkit-filter': 'drop-shadow( 1px 1px 0px #fff)',
    filter: 'drop-shadow( 1px 1px 0px #fff)',
  },
  hide: {
    display: 'none',
  },
  list: {
    width: '100vw',
  },
  fullList: {
    width: 'auto',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  },
}));

export default function Header() {
  const classes = useStyles();
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };

  const Navigation = (anchor) => (
      <AuthUserContext.Consumer>
        {authUser =>
          authUser ? (
            <NavigationAuth authUser={authUser}/>
          ) : (
            <NavigationNonAuth />
          )
        }
      </AuthUserContext.Consumer>
  );

  const NavigationAuth = ({ authUser }) => ( 
    <div> 
      <List component="nav" aria-label="Primary nav">
        <Link to={ROUTES.LANDING}>
          <ListItem
            button
            selected
          >
            <ListItemIcon>
              <RoomIcon />
            </ListItemIcon>
            <ListItemText primary="Food Finder Map" />
          </ListItem>
        </Link>
        <Link to={ROUTES.HOME}>
          <ListItem
            button
          >
            <ListItemIcon></ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
        </Link>
        <Link to={ROUTES.ACCOUNT}>
          <ListItem
            button
          >
            <ListItemIcon></ListItemIcon>
            <ListItemText primary="Account" />
          </ListItem>
        </Link>
        {!!authUser.roles[ROLES.ADMIN] && (
        <Link to={ROUTES.ADMIN}>
          <ListItem
            button
          >
            <ListItemIcon></ListItemIcon>
            <ListItemText primary="Admin" />
          </ListItem>
        </Link>
        )}
        <Link to={ROUTES.ACCOUNT}>
          <ListItem
            button
          >
            <ListItemIcon></ListItemIcon>
            <SignOutButton />
          </ListItem>
        </Link>
      </List>
    </div>
  );

  const NavigationNonAuth = () => (
    <div>
      <List component="nav" aria-label="Primary nav">
        <Link to={ROUTES.LANDING}>
          <ListItem
            button
            selected
          >
            <ListItemIcon>
              <RoomIcon />
            </ListItemIcon>
            <ListItemText primary="Food Finder Map" />
          </ListItem>
        </Link>
        <Link to={ROUTES.ABOUT}>
          <ListItem
            button
          >
            <ListItemIcon></ListItemIcon>
            <ListItemText primary="About" />
          </ListItem>
        </Link>
        <Link to={ROUTES.SIGN_IN}>
          <ListItem
            button
          >
            <ListItemIcon></ListItemIcon>
            <ListItemText primary="Sign In" />
          </ListItem>
        </Link>
      </List>
    </div>
  );

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar
        position="fixed"
        className={clsx(classes.appBar)}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open menu"
            onClick={handleDrawerOpen}
            edge="start"
            className={clsx(classes.menuButton)}
          >
            <MenuIcon />
          </IconButton>
          <img className={clsx(classes.title)} src={FoodFinderLogo} alt="Fair Food Finder" />
        </Toolbar>
      </AppBar>
      <Drawer open={open}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => setOpen(false)} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Toolbar>
        <div
          className={clsx(classes.list)}
          role="presentation"
          onClick={handleDrawerClose}
          onKeyDown={handleDrawerClose}
        >
        <Navigation />
        </div>
      </Drawer>
    </div>
  );
}
