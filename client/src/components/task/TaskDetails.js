// Styling
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
// React
import React, { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router'

import { Web3Context } from '../Web3Context';

const DisputeStages = {
    0: 'No Dispute',
    1: 'Internal Dispute',
    2: 'Third Party Involvement'
}

export default function TaskDetails() {
    const [task, setTask] = useState();
    const taskId = useParams().id;
    const { contract, formatEther } = useContext(Web3Context);

    useEffect(() => {
        const init = async () => {
            const task = await contract.getTask(taskId);
            setTask(task);
        }
        init();
    }, [])

    if(!task) return null;
    console.log(task);
    console.log(task.expiration.toString())
    let time = new Date(task.expiration.toString()*1000);
    // time.setUTCSeconds(task.expiration.toString());
    console.log(time)
    
    
    return (
        <div>
            <Typography variant="h3">
                {task.description}
            </Typography>
            <Grid container justifyContent="space-around">
                <Grid item>
                    Dispute Stage: {DisputeStages[task.dispute]}
                </Grid>
                <Grid item>
                    Price: {formatEther(task.price)} ETH
                </Grid>
                <Grid item>
                    Expiration Date: {time.toDateString()} | {time.toLocaleTimeString()}
                </Grid>
            </Grid>
        </div>
    )
}
