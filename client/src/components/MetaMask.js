import { ethers } from 'ethers';
import { useContext } from 'react';
import { Web3Context } from './Web3Context';

export default function MetaMask() {
    const { web3, setWeb3, setAccount } = useContext(Web3Context);

    const ethereum = window.ethereum;

    const enableEth = async () => {
        try {
            if(window.ethereum) {
                const accounts = await ethereum.request({
                    method: 'eth_requestAccounts'
                });

                setAccount(accounts[0]);
                setWeb3(ethers.providers.getDefaultProvider());
            } else if (window.web3) {
                setWeb3(window.web3);
                console.log("Injected web3 detected");
            } else {
                console.log("Please enable MetaMask");
            }
        } catch(err) {
            console.error(err);
        }
    }

    return (
        <div>
            <button
                onClick={enableEth}
            >
                Connect Wallet
            </button>
        </div>
    )
    
}