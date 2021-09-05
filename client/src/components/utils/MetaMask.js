// stylinf
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet'
// react
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
					contractAddress = '0x2E2Ed0Cfd3AD2f1d34481277b3204d807Ca2F8c2';
                // Rinkeby
				} else if (chainId === '0x4') {
					contractAddress = '0xC2400df68E385508DA03f106d283041A34888969';
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
        <>
            <Box pt={8}/>
            <Grid container justifyContent="center">
                <Button
                    variant="outlined"
                    size="large"
                    onClick={enableEth}
                    startIcon={<AccountBalanceWallet/>}
                >
                    Connect Wallet
                </Button>
            </Grid>
        </>
    )
    
}