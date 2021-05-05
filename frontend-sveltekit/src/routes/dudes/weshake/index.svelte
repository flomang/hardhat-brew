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
		toggleModal();
		//return await WeShakeApp.contract.methods
		//	.setTerms("Do the thing!")
		//	.send({ from: $selectedAccount });
	};

	$: agree = async () => {
		return await WeShakeApp.contract.methods
			.agree("Flow", "Rido")
			.send({ from: $selectedAccount });
	};

	$: toggleModal = () => {
		const overlay = document.querySelector("#overlay");
		overlay.classList.toggle("flex");
		overlay.classList.toggle("hidden");
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
				<div class="flex justify-center items-center">
					<button
						on:click={setTerms}
						class="bg-indigo-300 shadow-sm text-white text-sm font-medium px-4 py-3 rounded hover:bg-indigo-700"
						>Set Terms</button
					>
					<button
						on:click={agree}
						type="submit"
						class="bg-indigo-300 shadow-sm text-white text-sm font-medium px-4 py-3 border -ml-2 rounded rounded-l-none hover:bg-indigo-700"
					>
						Agree
					</button>
				</div>
				<div
					class="bg-black bg-opacity-50 inset-0 absolute hidden justify-center items-center"
					id="overlay"
				>
					<div
						class="bg-gray-200 max-w-sm py-2 px-2 rounded shadow-xl text-gray-800"
					>
						<div class="flex justify-between items-center">
							<h4 class="font-bold text-lg">Set Terms</h4>
							<svg
								on:click={toggleModal}
								class="w-5 h-5 cursor-pointer hover:bg-gray-300 rounded-full"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/></svg
							>
						</div>
						<div class="mt-2 text-sm">
							<p>
								Lorem ipsum dolor sit, amet consectetur
								adipisicing elit. Voluptatem excepturi soluta
								consequatur tempore facere. Est, fugit. Saepe
								architecto deserunt suscipit? Nihil maxime modi
								impedit fugit, deleniti eveniet explicabo quas
								numquam!
							</p>
						</div>
						<div class="mt-3 flex justify-end space-x-3">
							<button
								on:click={toggleModal}
								class="px-3 py-1 rounded hover:bg-red-300 hover:bg-opacity-40 hover:text-red-900"
								>Cancel</button
							>
							<button
								class="px-3 py-1 rounded bg-red-800 text-gray-200 hover:bg-red-600 "
								>Submit</button
							>
						</div>
					</div>
				</div>
			{:else}
				<div class="flex justify-center">
					<button
						on:click={agree}
						type="submit"
						class="py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded text-white bg-indigo-300 hover:bg-indigo-700"
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
