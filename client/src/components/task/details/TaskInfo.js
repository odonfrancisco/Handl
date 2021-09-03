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

import { ParticipantInfo } from './ParticipantInfo';


const DisputeStages = {
    0: 'No Dispute',
    1: 'Internal Dispute',
    2: 'Third Party Involvement'
}

export const TaskTitle = ({ description, completed }) => (
    <>
        <Grid item>
            <Typography variant="h3">
                {description}
            </Typography>
        </Grid>
        <Grid item>
            <Typography>
                {completed 
                    && "This task has been completed"}
            </Typography>
        </Grid>
    </>
)

const TaskInfo = ({
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
            <Typography>
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
            </Typography>
        </Grid>

    )
    return (
    <>
        {dispute != 'No Dispute'
            && (
                <Grid item>
                    <Typography>
                        Dispute Stage {dispute}
                    </Typography>
                </Grid>
            )}
        {isParticipant 
            && <EthAmount/>}
        <Grid item>
            <Typography>
                Expiration Date: {time.toDateString()} | {time.toLocaleTimeString()}
            </Typography>
        </Grid>
    </>
    )
}

export const TaskHeader = ({ 
    task, 
    isClient,
    isVendor,
    isParticipant, 
    formatEther
}) => {
    const time = new Date(task.expiration.toString()*1000);
    return (
        <Grid item container 
            direction="column"
            spacing={1}
            justifyContent="space-between">
            <TaskInfo
                dispute={DisputeStages[task.dispute]}
                taskCompleted={task.completed}
                price={task.price}
                clientApproved={task.client.approved}
                thirdPartyApproved={task.thirdParty.approved}
                time={time}
                formatEther={formatEther}
                isParticipant={isParticipant}
            />
            {isParticipant
                && <ParticipantInfo 
                        isClient={isClient}
                        isVendor={isVendor}
                        dispute={task.dispute}
                    /> }
        </Grid>
    )
}

export const AddThirdPartyButton = ({addThirdParty}) => (
    <>
        <Box p={2}/>
        <Grid container justifyContent="center">
            <Grid item>
                <Button 
                    variant="outlined"
                    onClick={() => {
                        addThirdParty().catch(err => {
                            console.error(err);
                        })
                }}>
                    Add yourself as a third party
                </Button>
            </Grid>
        </Grid>
    </>
)
