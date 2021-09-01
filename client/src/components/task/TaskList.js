import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function TaskList({ getTasks }) {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        const init = async () => {
            const tasks = await getTasks();
            setTasks(tasks);
        }
        init();
    }, [getTasks]);
    
    const TaskList = () => {
        if(tasks.length === 0){
            return (
                <Typography>
                    There are no tasks in this list.
                    <br/>
                    Please create a task or wait for your 
                    client to create the task for you
                </Typography>
            )
        }

        
        return tasks.map(task => {    
            return (<Grid item key={task.id}>
                <Link
                    style={{textDecoration: 'none'}}    
                    to={`/tasks/${task.id}`}
                >
                    <Button
                        style={{
                            fontSize: '120%'
                        }}
                    >
                        {task.description}
                    </Button>
                </Link>
            </Grid>
            )
        })
    }
    
    return (
        <Box pt={4}>
            <Grid 
                container
                direction="column"
                alignItems="center"
            >
                <TaskList/>
            </Grid>
        </Box>
    )
}