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

	$: getTerms = async () => {
		const instance = new $web3.eth.Contract(WeShake.abi, WeShake.address);
		return await instance.methods.terms().call();
	};

	$: setTerms = async () => {
		const instance = new $web3.eth.Contract(WeShake.abi, WeShake.address);
		return await instance.methods.setTerms('Do the thing!').send({ from: $selectedAccount });
	};

	$: agree = async () => {
		const instance = new $web3.eth.Contract(WeShake.abi, WeShake.address);
		return await instance.methods.agree('Flow', 'Rido').send({ from: $selectedAccount });
	};

	$: getMembers = async () => {
		const instance = new $web3.eth.Contract(WeShake.abi, WeShake.address);
		const members = await instance.methods.getAllMembers().call();
		return members;
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
	<p>Connected: {$connected}</p>
	{#if $web3.version && !$connected}
		<p>
			<button on:click={enableBrowser}>connect to the browser window provider </button> (eg Metamask)
		</p>
	{/if}

	{#if $connected}
		<p>
			{#await getTerms()}
				<span>terms waiting...</span>
			{:then value}
				<span>WeShake terms: {value}</span>
			{/await}
		</p>
		<p>
			{#await getMembers()}
				<span>members waiting...</span>
			{:then value}
				{#each value as person}
					<li>{person.firstName} {person.lastName}</li>
				{/each}
			{/await}
		</p>
		<p>
			<button on:click={setTerms}>set the terms </button>
		</p>
		<p>
			<button on:click={agree}>agree</button>
		</p>
		<!-- 
		{#if $selectedAccount}
			<p><button on:click="{sendTip}">send 0.01 {$nativeCurrency.symbol} tip to {tipAddress} (author)</button></p>
		{/if} -->
	{/if}
</main>

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
