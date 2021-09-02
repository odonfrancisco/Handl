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

const DisputeStages = {
    0: 'No Dispute',
    1: 'Internal Dispute',
    2: 'Third Party Involvement'
}

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

export const TaskInfo = ({
    dispute, 
    taskCompleted, 
    price,
    clientApproved, 
    thirdPartyApproved,
    time,
    formatEther,
    isParticipant
}) => {
    const EthAmount = () => (
        <Grid item>
        ETH 
            {taskCompleted ? (
                dispute === 'Third Party Involvement'
                    ? thirdPartyApproved 
                        ? " Transmitted"
                        : " Returned"
                    : clientApproved 
                        ? " Transmitted" 
                        : " Returned"
                    ) : " Locked"
            }: {formatEther(price)}
        </Grid>

    )
    return (
    <>
        <Grid item>
            Dispute Stage: {dispute}
        </Grid>
        {isParticipant 
            && <EthAmount/>}
        <Grid item>
            Expiration Date: {time.toDateString()} | {time.toLocaleTimeString()}
        </Grid>
    </>
    )
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
    console.log(Number.parseFloat(value))
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

export const ApproveButtons = ({
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
                        Disapprove
                    </Typography>
                </Button>
            </Grid>
        </>
    )
}

export const ParticipantInfo = ({isClient, isVendor, dispute}) => (
    <Box m={2.5}>
        You are the {isClient ? "Client" : isVendor ? "Vendor" : "Third Party"}
        <br/>
        {/* make colorful or some shit  */}
        {DisputeStages[dispute] === "Internal Dispute"
            && !isClient
            && "This is your second chance to provide " + 
                "evidence and make a case for yourself " +
                "before your client decides to involve a third party. " }
    </Box>
)

/* for some reason i had to separate this component from
being inside EvidenceForm because input would de-focus on 
each keystroke. */ 
const Form = ({evidence, setEvidence, addEvidence}) => {
    return (
    <>
        <TextField
            type="text"
            placeholder="Link to image of evidence"
            value={evidence}
            onChange={e => {
                setEvidence(e.target.value);
            }}
        />
        <IconButton
            // {...{disabled: disableButton}}
            onClick={async () => {
                // setDisableButton(true);
                addEvidence(evidence).then(() => {
                    // setDisableButton(false);
                    setEvidence('');
                }).catch(err => {
                    console.error(err);
                    // setDisableButton(false);
                });
                // setDisableButton(false);
                // if(success) {
                //     setEvidence('');
                // }
            }}
        >
            <Sendicon/>
        </IconButton>
    </>
    )
}
export const EvidenceForm = ({ addEvidence }) => {
    const [showEvidenceForm, setShowEvidenceForm] = useState(false);
    const [evidence, setEvidence] = useState('');
    // const [disableButton, setDisableButton] = useState(false);

    const EvidenceButton = () => (
        <Button
            onClick={() => {
                setShowEvidenceForm(bool => !bool);
            }}
        >
            <Typography>
                {showEvidenceForm ? "Hide Form" : "Add Evidence"}
            </Typography>
        </Button>
    )

    return (
        <Grid item>
            <EvidenceButton/>
            {showEvidenceForm 
                && <Form 
                    evidence={evidence} 
                    setEvidence={setEvidence}
                    addEvidence={addEvidence}/>}
        </Grid>
    )
}

export const EvidenceList = ({evidence}) => {
    return (
        <ImageList cols={1}>
            {evidence.map(item => (
                <ImageListItem key={item}>
                    <img 
                        alt="Evidence"
                        src={item} 
                        width="100%"
                        height="100%"
                    />
                </ImageListItem>
            ))}
        </ImageList>
    )
}

export const EvidenceColumn = ({evidence, party}) => {
    return (
        <Grid item container
        xs={6}
        direction="column"
        alignItems="center"
        >
            <Box m={2}>
                <Typography
                    variant="h5"
                >
                    {party} Evidence
                </Typography>
            </Box>
            <EvidenceList evidence={evidence}/>
        </Grid>
    )
}

export const AddThirdPartyButton = ({addThirdParty}) => (
    <button onClick={() => {
        addThirdParty().catch(err => {
            console.error(err);
        })
    }}>
        Add yourself as a third party
    </button>
)

