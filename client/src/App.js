import './styles/App.css';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
// React
import React, { useState, useContext } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
// Components
import MetaMask from './components/MetaMask';
import { Web3Context } from './components/Web3Context';
import NavBar from './components/NavBar';
import TaskCreate from './components/task/TaskCreate';
import TaskList from './components/task/TaskList';

function App() {
  const [redirect, setRedirect] = useState();
  const {
    provider, 
    account, 
    contract,
    parseEther
  } = useContext(Web3Context);
  
  const handleCreateTask = async (description, provider, expiresIn, amount) => {
    let success = false;
    try{
        const tx = await contract.createTask(
          provider, 
          description, 
          expiresIn,
          {value: parseEther(amount)});
        await tx.wait();
        setRedirect(<Redirect to={{
          pathname: '/myTasks'
        }}/>);
        success = true;
    } catch(err) {
      console.error(err);
      return false;
    }
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
              Disputed Tasks
            </Route>
            <Route exact path="/tasks/:id">
              Task Details Component
            </Route>
          </Switch>
        </Container>
      </Box>
    </Container>
  );
}

export default App;
