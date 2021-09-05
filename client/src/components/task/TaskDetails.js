// Styling
import Grid from '@material-ui/core/Grid';
// React
import React, { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router'
// Components
import { ParticipantAdminPanel } from './details/ParticipantInfo';
import { 
    TaskTitle,
    TaskHeader,
    AddThirdPartyButton } from './details/TaskInfo';
import { EvidenceColumn } from './details/TaskEvidence';
import { Web3Context } from '../utils/Web3Context';

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

            const clientAddress = task.client.to.toLowerCase();
            const vendorAddress = task.vendor.to.toLowerCase();
            const thirdPartyAddress = task.thirdParty.to.toLowerCase();
            const currentAccount = account.toLowerCase();
            // need a better way to settle whether user is participant or not
            
            if(DisputeStages[task.dispute] === 'Third Party Involvement') {
                if(currentAccount === thirdPartyAddress) {
                    setIsParticipant(true)
                } else if(currentAccount === clientAddress) {
                    setIsClient(true);                
                    setIsParticipant(true);
                } else if(currentAccount === vendorAddress) {
                    setIsVendor(true);
                    setIsParticipant(true);
                } else {
                    setIsParticipant(false);
                }        
            } else {
                if(currentAccount === clientAddress) {
                    setIsClient(true);
                    setIsParticipant(true);
                } else if(currentAccount === vendorAddress) {
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
        const clientAddress = task.client.to.toLowerCase();
        const vendorAddress = task.vendor.to.toLowerCase();
        const thirdPartyAddress = task.thirdParty.to.toLowerCase();
        if(account === clientAddress
            && task.vendor.approved) {
                isDisabled = false                
        } else if(account === vendorAddress
            && !task.vendor.approved) {
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

    if(!isParticipant
        && DisputeStages[task.dispute] === 'Third Party Involvement'
        && task.thirdParty.to === address0
    ) {
        return (
            <div>
                <TaskTitle
                    description={task.description}
                    completed={task.completed}
                />
                <TaskHeader
                    task={task}
                    isParticipant={isParticipant}
                    formatEther={formatEther}
                />
                <AddThirdPartyButton addThirdParty={handleAddThirdParty} />
            </div>
        )
    }

    if(!isParticipant) return ( 
        <>
            <Grid container
                justifyContent="space-between">
                    <TaskTitle 
                        description={task.description}
                        completed={task.completed}
                    />
            </Grid>
            <TaskHeader
                task={task}
                isParticipant={isParticipant}
                formatEther={formatEther}
            /> 
        </>
    );
    
    return (
        <div>
            <Grid container
                justifyContent="space-between">
                    <TaskTitle 
                        description={task.description}
                        completed={task.completed}
                    />
            </Grid>
            <Grid container justifyContent="space-between" >
                <Grid item sm xs >
                    <TaskHeader
                        task={task}
                        isClient={isClient}
                        isVendor={isVendor}
                        isParticipant={isParticipant}
                        formatEther={formatEther}
                    />
                </Grid>
                <Grid item sm xs={12}>
                    {!task.completed 
                        /* I don't like the way i'm handling all these
                        props. an object would be a cleaner way but even then
                        it seems like i'm passing way too many props */
                        && <ParticipantAdminPanel
                            isClient={isClient}
                            isVendor={isVendor}
                            approveButtonsDisabled={approveButtonsDisabled}
                            clientInputChoice={clientInputChoice}
                            handleTaskDecision={handleTaskDecision}
                            handleClientInputChoice={handleClientInputChoice}
                            handleCheckExpired={handleCheckExpired}
                            handleEvidenceAdd={handleEvidenceAdd}
                            handleAddFunds={handleAddFunds}
                            handleAddTime={handleAddTime}
                        /> }
                </Grid>
            </Grid>
            <Grid container>
                <EvidenceColumn 
                    party="Client" 
                    evidence={task.client.evidence}/>
                <EvidenceColumn 
                    party="Vendor"
                    evidence={task.vendor.evidence}/>
            </Grid>
        </div>
    )
}
