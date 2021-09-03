import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Sendicon from '@material-ui/icons/Send'
import ImageList from '@material-ui/core/ImageList';
import ImageListItem from '@material-ui/core/ImageListItem';
// React
import { useState } from 'react';

// timeframe enum
const Timeframe = {
    seconds: 1,
    minutes: 60,
    hours: 3600,
    days: 86400,
    weeks: 604800,
    months: 2592000,
    years: 31536000
}

export const ClientButtons = ({handleInputChoice, expireTask}) => {
    return (
        <>
            <Grid item>
                <Button 
                    variant="contained"
                    onClick={() => {
                        handleInputChoice('funds')
                    }}
                >
                    <Typography>
                        Add Funds
                    </Typography>
                </Button>
            </Grid>
            <Grid item>
                <Button
                    variant="contained"
                    onClick={() => {
                        handleInputChoice('time')
                    }}
                >
                    <Typography>
                        Add Time
                    </Typography>
                </Button>
            </Grid>
            <Grid item>
                <Button
                    variant="contained"
                    onClick={() => {
                        expireTask().catch(err => {
                            console.error(err);
                        })
                    }}
                >
                    <Typography>
                        Expired?
                    </Typography>
                </Button>
            </Grid>
        </>
    )
}

const handleInput = (value, func) => {
    let success = false;
    if(
        Number.isNaN(Number.parseFloat(value)) 
        && value.length > 0 
        && value !== '.') {
            success = false;
    } else {
        success = true;
        func(value)
    }
    return success;
}

const AddFunds = ({
    input, 
    setInput, 
    generateErr,
    addFunds
}) => (
    <Grid item>
        <TextField
            type="text"
            placeholder="Add Funds"
            value={input}
            onChange={e => {
                let value = e.target.value;
                if(!handleInput(value, setInput)) {
                    generateErr("Must pass a valid ETH amount");
                }
            }}
        />
        <Button
            variant="contained"
            onClick={addFunds}
        >
            Submit
        </Button>
    </Grid>
)

const AddTime = ({
    input, 
    setInput, 
    timeFrame, 
    setTimeFrame, 
    generateErr,
    addTime
}) => (
    <Grid item>
        <TextField
            type="text"
            placeholder="Add Time"
            value={input}
            onChange={e => {
                let value = e.target.value;
                if(!handleInput(value, setInput)){
                    generateErr("Must pass a valid time span");
                }
            }}
        />
        <Select
            labelId="timeframe-select"
            id="timeframe-select"
            value={timeFrame}
            onChange={e => {
                setTimeFrame(e.target.value);
            }}
        >
            <MenuItem value={'seconds'}>Seconds</MenuItem>
            <MenuItem value={'minutes'}>Minutes</MenuItem>
            <MenuItem value={'hours'}>Hours</MenuItem>
            <MenuItem value={'days'}>Days</MenuItem>
            <MenuItem value={'weeks'}>Weeks</MenuItem>
            <MenuItem value={'months'}>Months</MenuItem>
            <MenuItem value={'years'}>Years</MenuItem>
        
        </Select>
        <Button
            variant="contained"
            onClick={addTime}
        >
            Submit
        </Button>
    </Grid>
)

export const ClientInputs = ({inputChoice, addTime, addFunds}) => {
    const [err, setErr] = useState('');        
    const [timeFrame, setTimeFrame] = useState('days');
    const [input, setInput] = useState('');

    const generateErrorMessage = message => {
        setErr(message);
        setTimeout(() => {
            setErr('');
        }, 3000);
    }

    const handleAddTime = () => {
        const expirationTime = input * Timeframe[timeFrame];
        addTime(expirationTime).catch(err => {
            console.error(err);
            generateErrorMessage("Error handling transaction");
        })
    }

    const handleAddFunds = () => {
        addFunds(input).catch(err => {
            console.error(err);
            generateErrorMessage("Error handling transaction");
        });
    }

    const ClientInputChoice = {
        0: null,
        1: <AddFunds 
            input={input} 
            setInput={setInput}
            generateErr={generateErrorMessage}
            addFunds={handleAddFunds}
            />,
        2: <AddTime 
            input={input}
            setInput={setInput}
            timeFrame={timeFrame} 
            setTimeFrame={setTimeFrame}
            generateErr={generateErrorMessage}
            addTime={handleAddTime}
            />
    }
    
    return (
        <>
            {ClientInputChoice[inputChoice]}
            {err}
        </>
    )
}
