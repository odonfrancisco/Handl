import React, { useState, useEffect } from 'react';
import artifact from '../contracts/contracts/TaskAgreement.sol/TaskAgreement.json';
import ethers from 'ethers';

export const Web3Context = React.createContext();

export const Web3Provider = ({children}) => {
    const [web3, setWeb3] = useState(undefined);
    const [account, setAccount] = useState(undefined);
    const [contract, setContract] = useState(undefined);

    const ethereum = window.ethereum;

    useEffect(() => {
        if(web3) {
            enableContract();
        }
    }, [web3]);

    useEffect(() => {
        ethereum.on('chainChanged', handleChainChanged);
        return () => ethereum.removeListener('chainChanged', handleChainChanged);
    }, []);

    const handleChainChanged = () => {
        window.location.reload();
    }

    useEffect(() => {
        if(web3) {
            ethereum.on('accountsChanged', handleAccountsChanged);
            return () => ethereum.removeListener('accountsChanged', handleAccountsChanged)
        }
    });

    const handleAccountsChanged = accounts => {
        setAccount(accounts[0]);
    }

    const enableContract = async () => {
        try {
            // get contract using ethers
        } catch(err) {
            console.error(err);
        }
    }

    const contextValues = {
        web3,
        setWeb3,
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