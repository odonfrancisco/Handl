import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const Web3Context = React.createContext();

export const Web3Provider = ({children}) => {
    const [provider, setProvider] = useState(undefined);
    const [account, setAccount] = useState(undefined);
    const [contract, setContract] = useState(undefined);

    const ethereum = window.ethereum;

    useEffect(() => {
        if(provider && contract) {
            ethereum.on('accountsChanged', handleAccountsChanged);
            return () => ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
    });

    const handleAccountsChanged = accounts => {
        window.location.reload();
        // setContract(contract.connect(provider.getSigner(accounts[0])))
        // setAccount(accounts[0]);
    }
    
    useEffect(() => {
        ethereum.on('chainChanged', handleChainChanged);
        return () => 
            ethereum.removeListener('chainChanged', handleChainChanged);
    }, []);

    const handleChainChanged = chainId => {
        window.location.reload();
    }
    
    const contextValues = {
        ethers,
        parseEther: ethers.utils.parseEther,
        formatEther: ethers.utils.formatEther,
        isValidAddress: ethers.utils.isAddress,
        provider,
        setProvider,
        account,
        setAccount,
        contract,
        setContract
    }

    return (
        <Web3Context.Provider
            value={contextValues}
        >
            {children}
        </Web3Context.Provider>
    )

}