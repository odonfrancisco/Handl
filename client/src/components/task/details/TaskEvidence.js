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
            onClick={async () => {
                addEvidence(evidence).then(() => {
                    setEvidence('');
                }).catch(err => {
                    console.error(err);
                });
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

const EvidenceList = ({evidence}) => {
    return (
        <ImageList cols={1}>
            {evidence.map(item => (
                <ImageListItem 
                    key={item}
                    style={{
                        paddingLeft: 10,
                        paddingRight: 10
                    }}
                >
                    <img 
                        alt="Evidence"
                        src={item} 
                        width="auto"
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
