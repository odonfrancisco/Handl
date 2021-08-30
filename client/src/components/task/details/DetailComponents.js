import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Sendicon from '@material-ui/icons/Send'
import ImageList from '@material-ui/core/ImageList';
import ImageListItem from '@material-ui/core/ImageListItem';
// React
import { useState } from 'react';

export const ConsumerButtons = ({handleInputChoice}) => {
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


export const ConsumerInputs = inputChoice => {

    const AddFunds = () => (
        <Grid item>
            <TextField
                placeholder="Add Funds"
            />
        </Grid>
    )

    const AddTime = () => (
        <Grid item>
            <TextField
                placeholder="Add Time"
            />
        </Grid>
    )

    const ConsumerInputChoice = {
        0: null,
        1: <AddFunds/>,
        2: <AddTime/>
    }
    
    return (
        <>
            {ConsumerInputChoice[inputChoice.inputChoice]}
        </>
    )
}

export const ApproveButtons = ({approveDisabled}) => {
    return (
        <>
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
