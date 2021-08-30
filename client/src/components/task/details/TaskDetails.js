// Styling
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
// React
import React, { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router'
// Components
import { 
    ConsumerButtons, 
    ConsumerInputs,
    ApproveButtons, 
    EvidenceForm, 
    EvidenceList } from './DetailComponents';
import { Web3Context } from '../../utils/Web3Context';

const DisputeStages = {
    0: 'No Dispute',
    1: 'Internal Dispute',
    2: 'Third Party Involvement'
}

const Consumerinput = {
    none: 0,
    funds: 1,
    time: 2
}

// need to redirect if not participant (expect if in dispute.thirdParty)

export default function TaskDetails() {
    const [task, setTask] = useState();
    const [isConsumer, setIsConsumer] = useState(false);
    const [isParticipant, setIsParticipant] = useState(false);
    const [consumerInputChoice, setConsumerInputChoice] = useState(Consumerinput.none);
    const [approveDisabled, setApproveDisabled] = useState(false);
    const { contract, formatEther, account, ethers } = useContext(Web3Context);
    const taskId = useParams().id;

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
                setIsParticipant(true);
                task.provider.approved 
                    ? setApproveDisabled(false) 
                    : setApproveDisabled(true);
            } else if(currentAccount === providerAddress) {
                setIsParticipant(true);
                task.provider.approved 
                    ? setApproveDisabled(true) 
                    : setApproveDisabled(false);
            } else if(DisputeStages[task.dispute] === "Third Party Involvement") {
                if(currentAccount == thirdPartyAddress) setIsParticipant(true); 
                currentAccount === thirdPartyAddress && !task.thirdParty.approved 
                    ? setApproveDisabled(false)
                    : setApproveDisabled(true);
            } else {
                setIsParticipant(false);
                setApproveDisabled(true);
            }
        }
        init();
    }, [])

    const handleConsumerInputChoice = choice => {
        setConsumerInputChoice(Consumerinput[choice]);
    }
    
    const handleEvidenceAdd = async evidence => {
        const tx = await contract.addEvidence(task.id, evidence);
        let success;
        await tx.wait().then(async () => {
            const updatedTask = await contract.getTask(task.id);
            setTask(updatedTask);
            success = true;
        }).catch(err => {
            success = false;
            console.error(err);
        });

        return success;
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
            <Box m={4}/>
            <Grid container>
                <Grid item container 
                    xs={6} 
                    alignItems="flex-end" 
                    justifyContent="flex-start" 
                    spacing={2}
                >
                    {isParticipant 
                        && <ApproveButtons 
                                approveDisabled={approveDisabled}/>}
                </Grid>
                <Grid item container 
                    xs={6} 
                    justifyContent="flex-end"
                    spacing={2}
                >
                    {isConsumer 
                        && <ConsumerButtons 
                                handleInputChoice={handleConsumerInputChoice}/>}
                </Grid>
            </Grid>
            <Box m={2}/>
            <Grid container>
                <Grid item container 
                    xs={6} 
                    alignItems="flex-end" 
                    justifyContent="flex-start" 
                    spacing={2}
                >
                    {isParticipant 
                        && <EvidenceForm 
                                addEvidence={handleEvidenceAdd}/>}
                </Grid>
                <Grid item container 
                    xs={6} 
                    justifyContent="flex-end"
                    spacing={2}
                >
                    {isConsumer 
                        && <ConsumerInputs 
                                inputChoice={consumerInputChoice}/>}
                </Grid>
            </Grid>
            <Grid container>
                <Grid item container
                    xs={6}
                    direction="column"
                    alignItems="center"
                >
                    <Box m={2}>
                        <Typography
                            variant="h5"
                        >
                            Client Evidence
                        </Typography>
                    </Box>
                    <EvidenceList evidence={task.consumer.evidence}/>
                </Grid>
                <Grid item container
                    xs={6}
                    direction="column"
                    alignItems="center"
                >
                    <Box m={2}>
                        <Typography
                            variant="h5"
                        >
                            Vendor Evidence
                        </Typography>
                    </Box>
                    <EvidenceList evidence={task.provider.evidence}/>
                </Grid>
            </Grid>
        </div>
    )
}
