import './styles/App.css';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
// React
import React, { useState, useContext } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
// Components
import MetaMask from './components/utils/MetaMask';
import { Web3Context } from './components/utils/Web3Context';
import NavBar from './components/NavBar';
import TaskCreate from './components/task/TaskCreate';
import TaskList from './components/task/TaskList';
import TaskDetails from './components/task/TaskDetails';

// feature creep
// give eth locked a history of price additions for people to verify shit

function App() {
  const [redirect, setRedirect] = useState();
  const {
    provider, 
    contract,
    parseEther
  } = useContext(Web3Context);
  
  const handleCreateTask = async (description, provider, expiresIn, amount) => {
    let success = false;
    const tx = await contract.createTask(
      provider, 
      description, 
      expiresIn,
      {value: parseEther(amount)});
    await tx.wait().then(tx => {
      const id = tx.events[0].args.id;
      setRedirect(<Redirect to={{
        pathname: `/tasks/${id.toString()}`
      }}/>);
      success = true;  
    }).catch(err => {
      console.error(err);
      success = false;
    });

    return success;
  }

  const getUserTasks = async () => {
    let tasks = [];
    try {
      tasks = await contract.getUserTasks();
    } catch(err) {
      console.error(err);
    }
    return tasks;
  }

  const getDisputedTasks = async () => {
    let tasks = [];
    try{
      tasks = await contract.getDisputedTasks();
    } catch(err) {
      console.error(err);
    }
    return tasks;
  }
  
  if(!provider || !contract){
    return (
      <MetaMask/>
    )
  }
  
  return (
    <Container disableGutters>
      {redirect}
      <NavBar/>
      <Box mt={13}>
        <Container>
          <Switch>
            <Route exact path ="/">
              <Redirect to={{pathname: "/newTask"}}/>
            </Route>
            <Route exact path="/newTask">
              <TaskCreate handleCreateTask={handleCreateTask}/>
            </Route>
            <Route exact path="/myTasks">
              <TaskList getTasks={getUserTasks}/>
            </Route>
            <Route exact path="/disputedTasks">
              <TaskList 
                getTasks={getDisputedTasks}
                disputed={true}
              />
            </Route>
            <Route exact path="/tasks/:id">
              <TaskDetails/>
            </Route>
          </Switch>
        </Container>
      </Box>
    </Container>
  );
}

export default App;
