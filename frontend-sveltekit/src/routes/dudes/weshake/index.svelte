<script lang="ts">
	import { onMount } from 'svelte';
	import { ethStore, web3, selectedAccount, connected, chainName } from 'svelte-web3';
	import WeShake from '../../../../config/WeShake.json';

	const WeShakeApp = {
		web3: undefined,
		accounts: undefined,
		contract: undefined
	};
	let members = [];
	let terms = 'undefined';

	//$: checkAccount = $selectedAccount || '0x0000000000000000000000000000000000000000';
	//$: balance = $connected ? $web3.eth.getBalance(checkAccount) : '';

	$: setTerms = async () => {
		return await WeShakeApp.contract.methods.setTerms('Do the thing!').send({ from: $selectedAccount });
	};

	$: agree = async () => {
		return await WeShakeApp.contract.methods.agree('Flow', 'Rido').send({ from: $selectedAccount });
	};

	$: updateAccounts = async (accounts) => {
		WeShakeApp.accounts = accounts;
	};

	onMount(async () => {
		await ethStore.setBrowserProvider();
		if ($connected) {
			window.ethereum.on('accountsChanged', updateAccounts);
			WeShakeApp.web3 = $web3;
			WeShakeApp.contract = new $web3.eth.Contract(WeShake.abi, WeShake.address);

			members = await WeShakeApp.contract.methods.getAllMembers().call();
			terms = await WeShakeApp.contract.methods.terms().call();
		}
	});
</script>

<main>
	{#if $connected}
		<p>
			WeShake terms: {terms}
		</p>
		<p>
			{#each members as person}
				<li>{person.firstName} {person.lastName} agreed from: {person.addr}</li>
			{/each}
		</p>
		<p>
			<button on:click={setTerms}>set the terms </button>
		</p>
		<p>
			<button on:click={agree}>agree</button>
		</p>
	{:else}
	  <p>Not connected!</p>
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
