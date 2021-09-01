import { useContext, useEffect } from 'react';
import { Web3Context } from './Web3Context';
import contractArtifact from '../../contracts/contracts/TaskAgreement.sol/TaskAgreement.json';


export default function MetaMask() {
    const { setProvider, setAccount, setContract, ethers } = useContext(Web3Context);

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
                enableEth();
            }
        }
        init();
    }, []);

    const enableEth = async () => {
        try {
            if(window.ethereum) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const [account] = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                const chainId = await window.ethereum.request({
                    method: 'eth_chainId'
                })
                let contractAddress;

				// Hardhat Local
                // need a way to dynamically retrieve these values
				if (chainId === '0x7a69') {
					contractAddress = '0x572316aC11CB4bc5daf6BDae68f43EA3CCE3aE0e';
                // Rinkeby
				} else if (chainId === '0x4') {
					contractAddress = '';
                }
                
                const signer = provider.getSigner(account);
                const contract = new ethers.Contract(
                    contractAddress,
                    contractArtifact.abi,
                    signer
                )
                setProvider(provider);
                setAccount(account);
                setContract(contract);
            } else if (window.web3) {
                console.log("Update your MetaMask");
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