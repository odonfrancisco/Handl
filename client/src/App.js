import './styles/App.css';
import { useContext } from 'react';
import MetaMask from './components/MetaMask';
import { Web3Context } from './components/Web3Context';

function App() {
  const {web3, account} = useContext(Web3Context);
  
  if(!web3){
    return (
      <MetaMask/>
    )
  }
  
  return (
    <div>
      werkin
    </div>
  );
}

export default App;
