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
// Components
import {
    ClientButtons,
    ClientInputs } from './ClientSection';
import {
    EvidenceForm } from './TaskEvidence';
    
const DisputeStages = {
    0: 'No Dispute',
    1: 'Internal Dispute',
    2: 'Third Party Involvement'
}
    
const ApproveButtons = ({
    isDisabled,
    handleInput
}) => {
    const [approveDisabled, setApproveDisabled] = useState(isDisabled);
    return (
        <>
            <Grid item>
                <Button 
                    variant="contained"
                    {...{disabled: approveDisabled}}
                    onClick={() => {
                        setApproveDisabled(true);
                        handleInput(true).catch(err => {
                            console.error(err);
                            setApproveDisabled(false);
                        })
                    }}
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
                    onClick={() => {
                        setApproveDisabled(true);
                        handleInput(false).catch(err => {
                            console.error(err);
                            setApproveDisabled(false);
                        })
                    }}
                >
                    <Typography>
                        Reject
                    </Typography>
                </Button>
            </Grid>
        </>
    )
}

export const ParticipantInfo = ({isClient, isVendor, dispute}) => (
    <Box m={2}>
        <Typography>
            You are the {isClient ? "Client" : isVendor ? "Vendor" : "Third Party"}
            <br/>
            {/* make colorful or some shit  */}
            {DisputeStages[dispute] === "Internal Dispute"
                && !isClient
                && "This is your second chance to provide " + 
                    "evidence and make a case for yourself " +
                    "before your client decides to involve a third party. " }
        </Typography>
    </Box>
)

export const ParticipantAdminPanel = ({
    isClient,
    isVendor,
    approveButtonsDisabled,
    handleTaskDecision,
    handleClientInputChoice,
    handleCheckExpired,
    handleEvidenceAdd,
    clientInputChoice,
    handleAddFunds,
    handleAddTime
}) => (
    <>
        <Grid item container 
            direction="column"
            spacing={2}
        >
            <Grid item container 
                justifyContent="flex-end"
                spacing={2}
            >
                {isClient 
                    && <ClientButtons 
                            handleInputChoice={handleClientInputChoice}
                            expireTask={handleCheckExpired}
                            />}
            </Grid>
            <Grid item container 
                // xs={6} 
                // alignItems="flex-end" 
                justifyContent="flex-end" 
                spacing={2}
            >
                <ApproveButtons 
                    isDisabled={approveButtonsDisabled}
                    handleInput={handleTaskDecision}/>
            </Grid>
        </Grid>
        <Box m={2}/>
        <Grid item container>
            <Grid item container 
                justifyContent="flex-end"
            >
                {isClient 
                    && <ClientInputs 
                            inputChoice={clientInputChoice}
                            addFunds={handleAddFunds}
                            addTime={handleAddTime}/>}
            </Grid>
            <Grid item container 
                justifyContent="flex-end" 
            >
                {(isClient || isVendor)
                    && <EvidenceForm
                            addEvidence={handleEvidenceAdd}/>
                }
            </Grid>
        </Grid>
    </>
)

