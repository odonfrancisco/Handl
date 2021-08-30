// Styling
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
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
    const [isConsumer, setIsConsumer] = useState(false);
    const [approveDisabled, setApproveDisabled] = useState(false);
    const taskId = useParams().id;
    const { contract, formatEther, account, ethers } = useContext(Web3Context);

    useEffect(() => {
        const init = async () => {
            const task = await contract.getTask(taskId);
            const consumerAddress = task.consumer.to.toLowerCase();
            const providerAddress = task.provider.to.toLowerCase();
            const thirdPartyAddress = task.thirdParty.to.toLowerCase();
            const currentAccount = account.toLowerCase();

            setTask(task);
            if(currentAccount === consumerAddress) {
                setIsConsumer(true);
                task.provider.approved 
                    ? setApproveDisabled(false) 
                    : setApproveDisabled(true);
            } else if(currentAccount === providerAddress) {
                task.provider.approved 
                    ? setApproveDisabled(true) 
                    : setApproveDisabled(false);
            } else if(DisputeStages[task.dispute] === "Third Party Involvement") {
                currentAccount === thirdPartyAddress && !task.thirdParty.approved 
                    ? setApproveDisabled(false)
                    : setApproveDisabled(true);
            } else {
                setApproveDisabled(true);
            }
        }
        init();
    }, [])

    const ConsumerButtons = () => {
        return (
            <Grid item container 
            xs={6} 
            justifyContent="flex-end"
            spacing={2}>
                <Grid item>
                    <Button 
                        variant="contained"
                        {...{disabled: !isConsumer}}
                    >
                        <Typography>
                            Add Funds
                        </Typography>
                    </Button>
                </Grid>
                <Grid item>
                    <Button
                        variant="contained"
                        {...{disabled: !isConsumer}}
                    >
                        <Typography>
                            Add Time
                        </Typography>
                    </Button>
                </Grid>
            </Grid>
        )
    }

    if(!task) return null;
 
    let time = new Date(task.expiration.toString()*1000);
    
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
            <Box mt={4}>
                <Grid container>
                    <Grid item container 
                    xs={6} 
                    alignItems="flex-end" 
                    justifyContent="flex-start" 
                    spacing={2}>
                        <Grid item>
                            <Button 
                                variant="contained"
                                {...{disabled: approveDisabled}}
                            >
                                <Typography>
                                    Approve
                                </Typography>
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button 
                                variant="contained"
                                {...{disabled: approveDisabled}}
                            >
                                <Typography>
                                    Disapprove
                                </Typography>
                            </Button>
                        </Grid>
                    </Grid>
                    {isConsumer && <ConsumerButtons/>}
                </Grid>
            </Box>
        </div>
    )
}
