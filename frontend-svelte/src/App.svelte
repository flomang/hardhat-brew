<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>

<script lang="ts">
	import { onMount } from 'svelte';
	import { ethStore, web3, selectedAccount, connected, chainName } from 'svelte-web3';
	import OpenBet from '../config/OpenBet.json';
	//import OpenBet from '../../artifacts/contracts/basic_examples/OpenBet.sol/OpenBet.json';

	export let tipAddress;

	const enable = () => ethStore.setProvider('ws://localhost:8545');
	const enableBrowser = () => {
		ethStore.setBrowserProvider();
		//const contract = new $web3.eth.Contract(OpenBet.abi, '0x5FbDB2315678afecb367f032d93F642f64180aa3');
		//console.log(contract.AmountOne());
		console.log($connected);
	};

	$: checkAccount = $selectedAccount || '0x0000000000000000000000000000000000000000';
	$: balance = $connected ? $web3.eth.getBalance(checkAccount) : '';
	$: amount = async () => {
		const id = $web3.eth.net.getId();
		const instance = new $web3.eth.Contract(OpenBet.abi, OpenBet.address);
		const recieved = await instance.methods.bet(1).send({
		//	//gasPrice: $web3.utils.toHex($web3.utils.toWei('5', 'gwei')),
		//	//gasLimit: $web3.utils.toHex('21000'),
			from: $selectedAccount,
			value: $web3.utils.toHex(420),
		});

        //console.log(recieved);
		return await instance.methods.AmountOne().call();
		//return 10;
	};

	onMount(async () => {
		console.log('mounted');
		//console.log('Connecting to local hardhat Ethereum network...');
		//await ethStore.setProvider('ws://localhost:8545');
		if ($connected) {
			console.log('connected what?');
			//const contract = new $web3.eth.Contract(OpenBet.abi, '0x5FbDB2315678afecb367f032d93F642f64180aa3');
			//console.log(contract.AmountOne());
			console.log('done');
		}
	});
</script>

<main>
	<p>Web3 injected in window: {window.Web3 ? 'yes' : 'no'}</p>
	<p>Web3 version: {$web3.version} </p>
	<p>Connected: {$connected} </p>

	{#if $web3.version}
		<p>
			<button on:click="{enableBrowser}">connect to the browser window provider </button> (eg Metamask)
		</p>
	{/if}

	{#if $connected}
		<p>
			Connected chain: {$chainName}
		</p>
		<p>
			Selected account: {$selectedAccount || 'not defined'}
		</p>

		<p>
			Balance:
			{#await balance}
				<span>waiting...</span>
			{:then value}
				<span>{value}</span>
			{/await}

			{#await amount()}
				<span>amount waiting...</span>
			{:then value}
				<span>{value}</span>
			{/await}
		</p>
		<!-- 
		{#if $selectedAccount}
			<p><button on:click="{sendTip}">send 0.01 {$nativeCurrency.symbol} tip to {tipAddress} (author)</button></p>
		{/if} -->
	{/if}
</main>
