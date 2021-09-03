import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button';
import SendIcon from '@material-ui/icons/Send';

import React, { useState, useEffect, useContext } from 'react'
import { Web3Context } from '../utils/Web3Context';

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

export default function TaskCreate({ handleCreateTask }) {
        const [description, setDescription] = useState('');
        const [vendorAddress, setVendorAddress] = useState('');
        const [expiresIn, setExpiresIn] = useState(0);
        const [timeFrame, setTimeFrame] = useState('days');
        const [amount, setAmount] = useState('');
        const [err, setErr] = useState('');        
        const [buttonDisabled, setButtonDisabled] = useState(true);

        const { isValidAddress } = useContext(Web3Context);

        useEffect(() => {
            handleInput();
        }, [vendorAddress, description, expiresIn, amount])
        
        const handleTaskCreate = async () => {
            if(description.length < 0
                || !isValidAddress(vendorAddress)
                || expiresIn < 0
                || amount.length < 0){
                    generateErrorMessage("Must pass valid inputs to create a task");
                    return;
            }
            const expirationTime = expiresIn * Timeframe[timeFrame];

            handleCreateTask(
                description, 
                vendorAddress,
                expirationTime,
                amount).catch(err => {
                    let message = '';
                    if(err.data) {
                        message = err.data.message
                    }
                    const index = message.indexOf("'");
                    const errMessage = message
                        .slice(index+1, message.length-1);
                    generateErrorMessage(errMessage);
                    setButtonDisabled(false);
                });        
        }

        const handleInput = () => {
            if(description.length > 0
                && isValidAddress(vendorAddress)
                && expiresIn > 0
                && amount.length > 0){
                setButtonDisabled(false);
            } else {
                setButtonDisabled(true);
            }
        }

        const generateErrorMessage = message => {
            setErr(message);
            setTimeout(() => {
                setErr('');
            }, 3000);
        }
        
        return (
            <>
                <Box p={2}/>
                <Grid
                    container
                    justifyContent="center"
                >
                    <Typography variant="h3">
                        Create {description}
                    </Typography>
                </Grid>
                <Box p={2}/>
                <Grid 
                    container 
                    spacing={1} 
                    direction="column"
                    justifyContent="flex-end"
                    alignItems="center"
                >
                    <Grid item>
                        <TextField
                            type="text"
                            value={description}
                            placeholder="Task Description"
                            onChange={e => {
                                setDescription(e.target.value)
                            }}
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            type="text"
                            value={vendorAddress}
                            placeholder="Vendor Address"
                            onChange={e => {
                                setVendorAddress(e.target.value);
                                if(!isValidAddress(e.target.value)) {
                                    generateErrorMessage("Please input a valid address");
                                }
                            }}
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            type="number"
                            value={expiresIn}
                            placeholder="Expires In"
                            onChange={e => {
                                setExpiresIn(e.target.value)
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
                    </Grid>
                    <Grid item>
                        <TextField
                            type="text"
                            value={amount}
                            placeholder="ETH Amount"
                            onChange={e => {
                                let value = e.target.value;
                                if(Number.isNaN(Number.parseFloat(value)) && value.length > 0 && value !== '.') {
                                    generateErrorMessage("Must pass a valid ETH amount");
                                } else {
                                    setAmount(value)
                                }
                            }}
                        />
                    </Grid>
                    {err}
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            color="primary"
                            endIcon={<SendIcon/>}
                            {...{disabled: buttonDisabled}}
                            onClick={() => {
                                handleTaskCreate();
                                setButtonDisabled(true);
                            }}
                        >
                            Create
                        </Button>
                    </Grid>
                </Grid>

            </>

        )
}