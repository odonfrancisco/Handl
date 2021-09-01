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

const theme = createTheme({
    palette: {
        secondary: {
            main: "#607d8b"
        }
    }
})

const NavButton = ({link, icon, text}) => {
    /* I'm SUCH a perfectionist that i took the 15 lines 
    below and converted it the 28 lines you see. hehee. only did it 
    because the NavLink wouldn't trigger when clicking on edge of button */
    /* BUT, i will say that the process of correcting this issue led me 
    to be more component-oriented with how i program my react shit. so win-win */
    /* <Grid item xs={2}>
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
    </Grid> */
    return (
        <NavLink to={link}>
            <IconButton
                style={{
                    textDecoration: 'none',
                    color: '#eeeeee'
                }}
            >
                <Grid container 
                    direction="column"
                >
                    <Grid item>
                        {icon}
                    </Grid>
                    <Grid item>
                        <Typography>
                            {text}
                        </Typography>
                        
                    </Grid>
                </Grid>
            </IconButton>
        </NavLink>
    )
}

export default function NavBar() {
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
                            <NavButton
                                link={"/newTask"}
                                icon={<AddCircleIcon/>}
                                text={"New Task"}
                            />
                    </Grid>
                    <Grid item xs={2}>
                            <NavButton
                                link={"/myTasks"}
                                icon={<FormatListBulletedIcon/>}
                                text={"My Tasks"}
                            />
                    </Grid>
                    <Grid item xs={2}>
                            <NavButton
                                link={"/disputedTasks"}
                                icon={<LowPriority/>}
                                text={"Disputed Tasks"}
                            />
                    </Grid>
                </Grid>
            </AppBar>
        </ThemeProvider>
    )
}