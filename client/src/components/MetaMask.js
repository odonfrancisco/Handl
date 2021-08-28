import { ethers } from 'ethers';
import { useContext, useEffect } from 'react';
import { Web3Context } from './Web3Context';

export default function MetaMask() {
    const { web3, setWeb3, setAccount, setSigner } = useContext(Web3Context);

    useEffect(() => {
        const init = async () => {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            let address = undefined;
            try{
                address = await signer.getAddress();
            } catch(err) {
                console.error(err);
            }
            if(address) {
                setAccount(address);
                setSigner(signer);
                setWeb3(provider);
            }
        }
        init();
    }, []);

    const enableEth = async () => {
        try {
            if(window.ethereum) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const address = await signer.getAddress();
                setAccount(address);
                setSigner(signer);
                setWeb3(provider);
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