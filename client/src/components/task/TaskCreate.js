import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
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
        /* damn this naming convention for providerAddress lowkey confusing.
        debating using producer or something else so as to not get confused 
        with web3Provider */
        const [providerAddress, setProviderAddress] = useState('');
        const [expiresIn, setExpiresIn] = useState(0);
        const [timeFrame, setTimeFrame] = useState('days');
        const [amount, setAmount] = useState('');
        const [err, setErr] = useState('');        
        const [buttonDisabled, setButtonDisabled] = useState(true);

        const { isValidAddress } = useContext(Web3Context);

        useEffect(() => {
            handleInput();
        }, [providerAddress, description, expiresIn, amount])
        
        const handleTaskCreate = async () => {
            if(description.length < 0
                || !isValidAddress(providerAddress)
                || expiresIn < 0
                || amount.length < 0){
                    generateErrorMessage("Must pass valid inputs to create a task");
                    return;
            }
            const expirationTime = expiresIn * Timeframe[timeFrame];
            console.log('expirationTime');
            console.log(expirationTime);

            if(!(await handleCreateTask(
                    description, 
                    providerAddress,
                    expirationTime,
                    amount ))
            ){
                setButtonDisabled(false);
            }
        }

        const handleInput = () => {
            if(description.length > 0
                && isValidAddress(providerAddress)
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
            <Box pt={8}>
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
                            value={providerAddress}
                            placeholder="Provider Address"
                            onChange={e => {
                                setProviderAddress(e.target.value);
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

            </Box>

        )
}