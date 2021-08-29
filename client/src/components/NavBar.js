import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';

import AddCircleIcon from '@material-ui/icons/AddCircle';
import FormatListBulletedIcon from '@material-ui/icons/FormatListBulleted';
import LowPriority from '@material-ui/icons/LowPriority';

import React from 'react'
import { NavLink } from 'react-router-dom'

export default function NavBar() {

    const theme = createTheme({
        palette: {
            secondary: {
                main: "#607d8b"
            }
        }
    })
    
    return (
        <ThemeProvider theme={theme}>
            <AppBar 
                color="secondary"
            >
                <Grid container alignItems="center" justifyContent="flex-end"> 
                    <Grid item xs>
                        <Box ml={3}>
                            <Typography variant="h4" style={{
                                color: '#eeeeee'
                            }}>
                                Handl
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={2}>
                        <IconButton>
                            <NavLink
                                to="/newTask"
                                style={{
                                    textDecoration: 'none',
                                    color: '#eeeeee'
                                }}
                            >
                                <AddCircleIcon/>
                                <Typography>
                                    New Task
                                </Typography>
                            </NavLink>
                        </IconButton>
                    </Grid>
                    <Grid item xs={2}>
                        <IconButton>
                            <NavLink
                                to="/myTasks"
                                style={{
                                    textDecoration: 'none',
                                    color: '#eeeeee'
                                }}
                            >
                                <FormatListBulletedIcon/>
                                <Typography>
                                    My Tasks
                                </Typography>
                            </NavLink>
                        </IconButton>
                    </Grid>
                    <Grid item xs={2}>
                        <IconButton>
                            <NavLink
                                to="/disputedTasks"
                                style={{
                                    textDecoration: 'none',
                                    color: '#eeeeee'
                                }}
                            >
                                <LowPriority/>
                                <Typography>
                                    Disputed Tasks
                                </Typography>
                            </NavLink>
                        </IconButton>
                    </Grid>
                </Grid>
            </AppBar>
        </ThemeProvider>
    )
}