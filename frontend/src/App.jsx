import React, { useEffect, useState } from 'react';
import { ethers } from "ethers";
import counterContract from "./contract/Counter.json";
import "./App.css"
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Info from './components/Info';
import Counter from './components/Counter';
import { Heading,Text } from '@chakra-ui/react';
import { useToast } from "@chakra-ui/react";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [count,setCount] = useState(null);
  const toast = useToast();

  useEffect(()=>{
    if(count==null){
      updateCounter();
    }
  },[selectedAccount,count])

  const connectWallet = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
        const currentSigner = provider.getSigner();
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });

      if (chainId === '0x942') { 
        
        setSelectedAccount(accounts[0]);
        setIsConnected(true);
        setSigner(currentSigner);
        console.log('Connected to wallet', accounts[0]);
        console.log('Signer:', currentSigner);

        // Add event listener for account changes
        window.ethereum.on('accountsChanged', (newAccounts) => {
          let provider_ = new ethers.providers.Web3Provider(window.ethereum);
          setSelectedAccount(newAccounts[0]);
          setSigner(provider_.getSigner());
        });
      } else {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x942' }], 
        });
      }
    } catch (error) {
      console.error(error);
      alert("unrecognized network")
    }
  };

  const addNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x942',
          chainName: 'Exzo Testnet',
          nativeCurrency: {
            name: 'Exzo',
            symbol: 'XZO',
            decimals: 18,
          },
          rpcUrls: ['https://evm-test.exzo.network'],
          blockExplorerUrls: ['https://evm-testnet.exzoscan.io/'], 
        }],
      });
    } catch (error) {
      console.error(error);
    }
  };

  const updateCounter = async () => {
    if (signer) {
      const contract = new ethers.Contract(counterContract.address,counterContract.abi,signer);
      const countVal = await contract.getCount();
      console.log("here")
      console.log(parseInt(countVal._hex,16))
      setCount(parseInt(countVal._hex,16))
    }
  };

  const incrementCounter = async () => {
    if (signer) {
      try {
        const contract = new ethers.Contract(counterContract.address,counterContract.abi,signer);
        const res = (await contract.increment({
          gasPrice: ethers.utils.parseUnits('2', 'gwei') 
        }))
        if(res){
          await updateCounter()
          toast({
            title: "Transaction Successful",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.log(error);
        toast({
          title: "Encountered an Error",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }else{
      toast({
        title: "Encountered an Error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const decrementCounter = async () => {
    
    if (signer) {
      try {
        const contract = new ethers.Contract(counterContract.address,counterContract.abi,signer);
        const res = (await contract.decrement({
          gasPrice: ethers.utils.parseUnits('2', 'gwei') 
        }))
        if(res){
          await updateCounter();
          toast({
            title: "Transaction Successful",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.log(error)
        toast({
          title: "Encountered an Error",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
     
    }else{
      toast({
        title: "Encountered an Error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <div className='app-container'>
      <Navbar func={isConnected? ()=>{}: connectWallet} text={isConnected?`${selectedAccount.slice(0, 6)}...${selectedAccount.slice(-4)}`:"Connect Wallet"}/>
      {signer?(
        <div style={{ display: 'flex',flexDirection:'column', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <Heading as='h2' size='xl' style={{ borderBottom: '2px solid #ccc' }}>
          
        npx <span style={{ backgroundColor: '#2ef2b1' }}>create-exzo-dapp</span>
      </Heading>
      <div style={{margin:'20px',maxWidth:'50%'}}>
      <Text fontSize='lg'>
            Click on buttons to increment or decrement the value of counter. Note that, it takes few seconds to update the value ,if it doesn't update kindly click on refresh button.
          </Text>
          </div>
        <Counter incrementCounter={incrementCounter} count={count} decrementCounter={decrementCounter} updateCounter={updateCounter}/>
        </div>
      ):<Info/>}

      <Footer isConnected={isConnected} addNetwork={addNetwork} />
    </div>
  );
}

export default App;
