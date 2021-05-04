<script lang="ts">
	import { onMount } from "svelte";
	import {
		ethStore,
		web3,
		selectedAccount,
		connected,
		chainName,
	} from "svelte-web3";
	import WeShake from "../../../../config/WeShake.json";

	const WeShakeApp = {
		web3: undefined,
		accounts: undefined,
		contract: undefined,
	};
	let members = [];
	let terms = "undefined";
	let owner = "";

	//$: checkAccount = $selectedAccount || '0x0000000000000000000000000000000000000000';
	//$: balance = $connected ? $web3.eth.getBalance(checkAccount) : '';

	$: setTerms = async () => {
		return await WeShakeApp.contract.methods
			.setTerms("Do the thing!")
			.send({ from: $selectedAccount });
	};

	$: agree = async () => {
		return await WeShakeApp.contract.methods
			.agree("Flow", "Rido")
			.send({ from: $selectedAccount });
	};

	$: updateAccounts = async (accounts) => {
		WeShakeApp.accounts = accounts;
	};

	onMount(async () => {
		await ethStore.setBrowserProvider();
		if ($connected) {
			window.ethereum.on("accountsChanged", updateAccounts);
			WeShakeApp.web3 = $web3;
			WeShakeApp.contract = new $web3.eth.Contract(
				WeShake.abi,
				WeShake.address
			);

			members = await WeShakeApp.contract.methods.getAllMembers().call();
			terms = await WeShakeApp.contract.methods.terms().call();
			owner = await WeShakeApp.contract.methods.owner().call();
		}
	});
	let checked = true;
</script>

<main>
	{#if $connected}
		<div class="max-w-xl mx-auto bg-gray-100 rounded-xl shadow-lg">
			<div>
				<h1 class="text-lg flex justify-center">WeShake Terms:</h1>
				<p class="text-sm py-3 flex justify-center">{terms}</p>
			</div>
			<div>
				<h1 class="text-lg flex justify-center">Members:</h1>
				<ul class="bg-gray-300 p-4 rounded divide-y">
					{#each members as person}
						<li>
							{person.firstName}
							{person.lastName} ({person.addr})
						</li>
					{/each}
				</ul>
			</div>

			{#if owner.toLowerCase() == $selectedAccount}
				<div class="flex justify-center py-2">
					<button
						on:click={setTerms}
						class="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>Set Terms</button
					>
				</div>
				<div class="flex justify-center py-2">
					<button
						on:click={agree}
						type="submit"
						class="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
					 Agree!	
					</button>
				</div>
			{:else}
				<div class="flex justify-center py-2">
					<button
						on:click={agree}
						type="submit"
						class="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Agree
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<p>Not connected!</p>
	{/if}
</main>

<style>
</style>
