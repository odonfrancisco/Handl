// Styling
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
// React
import React, { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router'
// Components
import { 
    TaskInfo,
    ClientButtons, 
    ClientInputs,
    ApproveButtons, 
    ParticipantInfo,
    EvidenceForm, 
    EvidenceColumn,
    AddThirdPartyButton } from './DetailComponents';
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

const address0 = "0x0000000000000000000000000000000000000000";

// need to test if expired without expire button
// for some reason, can't set a task to expire faster than like 3 minutes or so.
// add toggle to switch between completed and in-progress tasks
// when create task, send to taskDetails page, not taskList

// feature creep
// a crucial piece would be a sort of message board on taskDetails page
// indicate what ended the task (expired, client disapproved, etcs)

export default function TaskDetails() {
    const [task, setTask] = useState();
    const [isClient, setIsClient] = useState(false);
    // literally only using this next state inside of one component
    const [isVendor, setIsVendor] = useState(false);
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
            
            if(DisputeStages[task.dispute] === 'Third Party Involvement') {
                if(currentAccount === thirdPartyAddress) {
                    setIsParticipant(true)
                } else if(currentAccount === clientAddress) {
                    setIsClient(true);                
                    setIsParticipant(true);
                } else if(currentAccount === providerAddress) {
                    setIsVendor(true);
                    setIsParticipant(true);
                } else {
                    setIsParticipant(false);
                }        
            } else {
                if(currentAccount === clientAddress) {
                    setIsClient(true);
                    setIsParticipant(true);
                } else if(currentAccount === providerAddress) {
                    setIsVendor(true);
                    setIsParticipant(true);
                } else {
                    setIsParticipant(false);
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
        if(approve) {
            const tx = await contract.approveTask(task.id);
            await tx.wait().then(async () => {
                const updatedTask = await contract.getTask(task.id);
                setTask(updatedTask);
                success = true;
            }).catch(err => {
                console.error(err);
                success = false;
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

    const handleAddThirdParty = async () => {
        const tx = await contract.assignThirdParty(task.id);
        tx.wait().then(async () => {
            const updatedTask = await contract.getTask(task.id);
            setTask(updatedTask);
            setIsParticipant(true);
        }).catch(err => {
            console.error(err);
        })
    }

    const handleCheckExpired = async () => {
        const tx = await contract.expireTask(task.id);
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

    const TaskHeader = () => (
        <Grid item xs>
            <Grid item container
                justifyContent="space-between">
                <Grid item>
                    <Typography variant="h3">
                        {task.description}
                    </Typography>
                </Grid>
                <Grid item>
                    <Typography>
                        {task.completed 
                            && "This task has been completed"}
                    </Typography>
                </Grid>
            </Grid>
            <Grid item container justifyContent="space-between">
                <TaskInfo
                    dispute={DisputeStages[task.dispute]}
                    taskCompleted={task.completed}
                    price={task.price}
                    clientApproved={task.consumer.approved}
                    thirdPartyApproved={task.thirdParty.approved}
                    time={time}
                    formatEther={formatEther}
                    isParticipant={isParticipant}
                />
            </Grid>
        </Grid>
    )

    const ParticipantAdminPanel = () => (
        <>
            <Grid item container>
                <Grid item container 
                    xs={6} 
                    alignItems="flex-end" 
                    justifyContent="flex-start" 
                    spacing={2}
                >
                    <ApproveButtons 
                        isDisabled={approveButtonsDisabled}
                        handleInput={handleTaskDecision}/>
                </Grid>
                <Grid item container 
                    xs={6} 
                    justifyContent="flex-end"
                    spacing={2}
                >
                    {isClient 
                        && <ClientButtons 
                                handleInputChoice={handleClientInputChoice}
                                expireTask={handleCheckExpired}
                                />}
                </Grid>
            </Grid>
            <Box m={2}/>
            <Grid item container>
                <Grid item container 
                    xs={6} 
                    alignItems="flex-end" 
                    justifyContent="flex-start" 
                    spacing={2}
                >
                    {(isClient || isVendor)
                        && <EvidenceForm
                                addEvidence={handleEvidenceAdd}/>
                    }
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

        </>
    )

    if(!isParticipant
        && DisputeStages[task.dispute] === 'Third Party Involvement'
        && task.thirdParty.to === address0
    ) {
        return (
            <div>
                <TaskHeader/>
                <AddThirdPartyButton addThirdParty={handleAddThirdParty} />
            </div>
        )
    }

    if(!isParticipant) return ( <TaskHeader/> );
    
    return (
        <div>
        {console.log('oneffect')}
            <Grid container >
                <TaskHeader/>
            </Grid>
            <ParticipantInfo 
                    isClient={isClient}
                    isVendor={isVendor}
                    dispute={task.dispute}/>
            <Grid container>
                {!task.completed 
                    && <ParticipantAdminPanel/> }
            </Grid>
            <Grid container>
                <EvidenceColumn 
                    party="Client" 
                    evidence={task.consumer.evidence}/>
                <EvidenceColumn 
                    party="Vendor"
                    evidence={task.provider.evidence}/>
            </Grid>
        </div>
    )
}
