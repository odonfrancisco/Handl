// Styling
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
// React
import React, { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router'
// Components
import { 
    ClientButtons, 
    ClientInputs,
    ApproveButtons, 
    EvidenceForm, 
    EvidenceList } from './DetailComponents';
import { Web3Context } from '../../utils/Web3Context';

const DisputeStages = {
    0: 'No Dispute',
    1: 'Internal Dispute',
    2: 'Third Party Involvement'
}

const Clientinput = {
    none: 0,
    funds: 1,
    time: 2
}

// need to redirect if not participant (expect if in dispute.thirdParty)
// need to show something completely different is task.completed
// need to add button to check if task is expired

export default function TaskDetails() {
    const [task, setTask] = useState();
    const [isClient, setIsClient] = useState(false);
    const [isParticipant, setIsParticipant] = useState(false);
    const [clientInputChoice, setClientInputChoice] = useState(Clientinput.none);
    const { contract, formatEther, account, parseEther } = useContext(Web3Context);
    const taskId = useParams().id;

    useEffect(() => {
        const init = async () => {
            const task = await contract.getTask(taskId);
            setTask(task);

            const clientAddress = task.consumer.to.toLowerCase();
            const providerAddress = task.provider.to.toLowerCase();
            const thirdPartyAddress = task.thirdParty.to.toLowerCase();
            const currentAccount = account.toLowerCase();
            // need a better way to settle whether user is participant or not

            if(currentAccount === clientAddress) {
                setIsClient(true);                
                setIsParticipant(true);
            }
            
            if(DisputeStages[task.dispute] === 'Third Party Involvement') {
                if(currentAccount == thirdPartyAddress) setIsParticipant(true); 
                // currentAccount === thirdPartyAddress && !task.thirdParty.approved 
                //     ? setApproveDisabled(false)
                //     : setApproveDisabled(true);
                /* if(currentAccount === clientAddress) {
                    setIsClient(true);                
                    setIsParticipant(true);
                } else  */if(currentAccount === providerAddress) {
                    setIsParticipant(true);
                } else {
                    setIsParticipant(false);
                }        
            } else {
                if(currentAccount === clientAddress) {
                    // setIsClient(true);
                    // setIsParticipant(true);
                    // task.provider.approved 
                    //     ? setApproveDisabled(false) 
                    //     : setApproveDisabled(true);
                } else if(currentAccount === providerAddress) {
                    setIsParticipant(true);
                    // task.provider.approved 
                    //     ? setApproveDisabled(true) 
                    //     : setApproveDisabled(false);
                } else {
                    setIsParticipant(false);
                    // setApproveDisabled(true);
                }    
            }
        }
        init();
    }, [])
    

    const handleClientInputChoice = choice => {
        if(clientInputChoice === Clientinput[choice]) {
            setClientInputChoice(Clientinput.none);
            return;
        }
        setClientInputChoice(Clientinput[choice]);
    }

    const handleTaskDecision = async approve => {
        let success = false;
        // setApproveDisabled(true);
        if(approve) {
            const tx = await contract.approveTask(task.id);
            await tx.wait().then(async () => {
                const updatedTask = await contract.getTask(task.id);
                setTask(updatedTask);
                success = true;
            }).catch(err => {
                console.error(err);
                success = false;
                // setApproveDisabled(false);
            })
        } else {
            const tx = await contract.disapproveTask(task.id);
            await tx.wait().then(async () => {
                const updatedTask = await contract.getTask(task.id);
                setTask(updatedTask);
                success = true;
            }).catch(err => {
                console.error(err);
                success = false;
                // setApproveDisabled(false);
            })
        }
        return success;
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

    const handleAddTime = async time => {
        const tx = await contract.addTime(task.id, time);
        tx.wait().then(async () => {
            const updatedTask = await contract.getTask(task.id);
            setTask(updatedTask);
        }).catch(err => {
            console.error(err);
        })        
    }

    const handleAddFunds = async amount => {
        const tx = await contract.addFunds(task.id, {value: parseEther(amount)});
        tx.wait().then(async () => {
            const updatedTask = await contract.getTask(task.id);
            setTask(updatedTask);
        }).catch(err => {
            console.error(err);
        })
    }

    const approveButtonsDisabled = () => {        
        let isDisabled = true;
        const clientAddress = task.consumer.to.toLowerCase();
        const providerAddress = task.provider.to.toLowerCase();
        const thirdPartyAddress = task.thirdParty.to.toLowerCase();
        if(account === clientAddress
            && task.provider.approved) {
                isDisabled = false                
        } else if(account === providerAddress
            && !task.provider.approved) {
                isDisabled = false
        }
        if(DisputeStages[task.dispute] === 'Third Party Involvement'){
            account === thirdPartyAddress && !task.thirdParty.approved 
            ? isDisabled = false
            : isDisabled = true;    
        }

        return isDisabled;
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
            <Box m={2.5}>
                {console.log('oneffect')}
                You are the {isClient ? "Client" : "Vendor"}
            </Box>
            <Grid container>
                <Grid item container 
                    xs={6} 
                    alignItems="flex-end" 
                    justifyContent="flex-start" 
                    spacing={2}
                >
                    {isParticipant 
                        && <ApproveButtons 
                                isDisabled={approveButtonsDisabled}
                                handleInput={handleTaskDecision}/>}
                </Grid>
                <Grid item container 
                    xs={6} 
                    justifyContent="flex-end"
                    spacing={2}
                >
                    {isClient 
                        && <ClientButtons 
                                handleInputChoice={handleClientInputChoice}
                                />}
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
                    {isClient 
                        && <ClientInputs 
                                inputChoice={clientInputChoice}
                                addFunds={handleAddFunds}
                                addTime={handleAddTime}/>}
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
