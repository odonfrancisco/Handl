import Grid from '@material-ui/core/Grid';
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
import { useState, useEffect } from 'react';

export const ClientButtons = ({handleInputChoice}) => {
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
        </>
    )
}

const AddFunds = ({
    input, 
    setInput, 
    generateErr,
    addFunds
}) => (
    <Grid item>
        <input
            type="text"
            placeholder="Add Funds"
            value={input}
            onChange={e => {
                let value = e.target.value;
                if(Number.isNaN(Number.parseFloat(value)) && value.length > 0 && value !== '.') {
                    generateErr("Must pass a valid ETH amount");
                } else {
                    setInput(value)
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
    // )
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
                if(Number.isNaN(Number.parseFloat(value)) && value.length > 0 && value !== '.') {
                    generateErr("Must pass a valid time span");
                } else {
                    setInput(value)
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

export const EvidenceForm = ({ addEvidence }) => {
    const [showEvidenceForm, setShowEvidenceForm] = useState(false);
    const [disableButton, setDisableButton] = useState(false);
    const [evidence, setEvidence] = useState('');

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

    const Form = () => (
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
                {...{disabled: disableButton}}
                onClick={async () => {
                    setDisableButton(true);
                    addEvidence(evidence).then(() => {
                        setDisableButton(false);
                        setEvidence('');
                    }).catch(err => {
                        console.error(err);
                        setDisableButton(false);
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
    
    return (
        <Grid item>
            <EvidenceButton/>
            {showEvidenceForm && <Form/>}
        </Grid>
    )
}

export const EvidenceList = ({evidence}) => {
    return (
        <ImageList cols={1}>
            {evidence.map(item => (
                <ImageListItem key={item}>
                    <img 
                        src={item} 
                        width="100%"
                        height="100%"
                    />
                </ImageListItem>
            ))}
        </ImageList>
    )
}