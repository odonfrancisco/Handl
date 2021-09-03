import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const TaskFilter = {
    0: "All Tasks",
    1: "Unfinished",
    2: "Completed"
}

export default function TaskList({ getTasks, disputed }) {
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [filter, setFilter] = useState(0)

    useEffect(() => {
        const init = async () => {
            const tasks = await getTasks();
            setTasks(tasks);
            setFilteredTasks(tasks);
        }
        init();
    }, [getTasks]);

    useEffect(() => {
        const filteredTasks = tasks.filter(task => {
            switch(filter) {
                case 0: return task;
                case 1: return !task.completed;
                case 2: return task.completed;
            }
        })
        setFilteredTasks(filteredTasks);
    }, [tasks, filter])

    const handleFilter = () => {
        setFilter(filter => {
            let updated = filter + 1;
            if(updated > 2){
                updated = 0;
            }
            return updated;
        })
    }
    
    const TaskList = () => {
        const taskList = disputed ? tasks : filteredTasks;
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
        
        return taskList.map(task => {    
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

    const FilterButton = () => (
        <Grid item>
            <Button
                variant="outlined"
                onClick={handleFilter}
            >
                {TaskFilter[filter]}
            </Button>
        </Grid>
    )
    
    return (
        <Box pt={4}>
            <Grid container
                justifyContent="flex-end"
            >
                {!disputed && tasks.length > 0
                    && <FilterButton/> }
                <Grid item>
                    <Box p={3}/>
                </Grid>
            </Grid>
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