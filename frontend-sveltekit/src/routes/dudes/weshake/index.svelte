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
	import WeShake from '../../../../config/WeShake.json';

	const enableBrowser = () => {
		ethStore.setBrowserProvider();
		console.log($connected);
	};

	$: checkAccount = $selectedAccount || '0x0000000000000000000000000000000000000000';
	$: balance = $connected ? $web3.eth.getBalance(checkAccount) : '';

	$: terms = async () => {
		const instance = new $web3.eth.Contract(WeShake.abi, WeShake.address);
		return await instance.methods.terms().call();
	};

    $: setTerms = async () => {
        console.log(WeShake.address);
        console.log($selectedAccount);

		const instance = new $web3.eth.Contract(WeShake.abi, WeShake.address);

        const owner = await instance.methods.owner().call();
        console.log(owner);

		return await instance.methods.setTerms("Do the thing!").send({from: $selectedAccount});
	};

	onMount(async () => {
		console.log('mounted');
		//console.log('Connecting to local hardhat Ethereum network...');
		//await ethStore.setProvider('ws://localhost:8545');
		if ($connected) {
			//console.log('connected what?');
			//const contract = new $web3.eth.Contract(OpenBet.abi, '0x5FbDB2315678afecb367f032d93F642f64180aa3');
			//console.log(contract.AmountOne());
			//console.log('done');
		}
	});
</script>

<main>
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
			{#await terms()}
				<span>terms waiting...</span>
			{:then value}
				<span>current terms:{value}</span>
			{/await}
		</p>
      	<p>
			<button on:click="{setTerms}">set the terms </button> 
		</p>
		<!-- 
		{#if $selectedAccount}
			<p><button on:click="{sendTip}">send 0.01 {$nativeCurrency.symbol} tip to {tipAddress} (author)</button></p>
		{/if} -->
	{/if}
</main>
