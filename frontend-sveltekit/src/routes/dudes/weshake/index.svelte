<script lang="ts">
	import { onMount } from "svelte";
	import { ethStore, web3, selectedAccount, connected } from "svelte-web3";
	import WeShake from "../../../../config/WeShake.json";

	const WeShakeApp = {
		web3: undefined,
		accounts: undefined,
		contract: undefined,
	};
	let members = [];
	let terms = "undefined";
	let newTerms = "undefined";
	let owner = "";
	let name = "";

	//$: checkAccount = $selectedAccount || '0x0000000000000000000000000000000000000000';
	//$: balance = $connected ? $web3.eth.getBalance(checkAccount) : '';

	$: setTerms = async () => {
		await WeShakeApp.contract.methods
			.setTerms(newTerms)
			.send({ from: $selectedAccount });

		terms = newTerms;
		toggleModal();
	};

	$: agree = async () => {
		try {
			await WeShakeApp.contract.methods
				.agree()
				.send({ from: $selectedAccount });

			//members = await WeShakeApp.contract.methods.getAllMembers().call();
			//toggleAgreeModal();
		} catch (error) {
			if (
				error.message.includes(
					"you have already agreed to this contract"
				)
			) {
				alert("You've already agreed!");
			} else if (
				error.message.includes("User denied transaction signature")
			) {
				//toggleAgreeModal();
			} else {
				console.error("agree error:", error.message);
			}
		}
	};

	$: register = async () => {
		try {
			await WeShakeApp.contract.methods
				.register(name)
				.send({ from: $selectedAccount });

			toggleRegisterModal();
		} catch (error) {
			if (error.message.includes("you are already registered")) {
				alert("You've already registered!");
			} else if (
				error.message.includes("User denied transaction signature")
			) {
				toggleRegisterModal();
			} else {
				console.error("register error:", error.message);
			}
		}
	};

	$: isRegistered = () => {
		for (let i = 0; i < members.length; ++i) {
			let member = members[i];
			if (member.addr.toLowerCase() == $selectedAccount) {
				return true;
			}
		}
		return false;
	};

	$: hasAgreed = () => {
		for (let i = 0; i < members.length; ++i) {
			let member = members[i];
			if (
				member.addr.toLowerCase() == $selectedAccount &&
				member.agreed
			) {
				return true;
			}
		}
		return false;
	};

	$: toggleModal = () => {
		const overlay = document.querySelector("#overlay");
		overlay.classList.toggle("flex");
		overlay.classList.toggle("hidden");
	};

	$: toggleRegisterModal = () => {
		const overlay = document.querySelector("#registerModal");
		overlay.classList.toggle("flex");
		overlay.classList.toggle("hidden");
	};

	$: updateAccounts = async (accounts) => {
		WeShakeApp.accounts = accounts;
	};

	$: listenToRegister = (fromBlockNumber) => {
		console.log("listening to register");
		WeShakeApp.contract.events.PersonRegistered(
			{
				fromBlock: fromBlockNumber || 0,
			},
			(err, contractEvent) => {
				if (err) {
					console.error("register listen error", err);
					return;
				}
				const { event, returnValues, blockNumber } = contractEvent;
				const { name, fromAddress } = returnValues;
				console.log(
					`${event} emitted: ${name} registered from ${fromAddress} (block #${blockNumber})`
				);

				let found = false;
				for (let i = 0; i < members.length; ++i) {
					if (members[i].addr == fromAddress) {
						found = true;
					}
				}

				if (!found) {
					const mems = document.querySelector("#members");
					const li = document.createElement("li");
					const txt = document.createTextNode(
						`${name} has not agreed (${fromAddress})`
					);
					li.appendChild(txt);
					mems.appendChild(li);
				}
			}
		);
	};

	$: listenToAgreements = (fromBlockNumber) => {
		console.log("listening to agree");
		WeShakeApp.contract.events.PersonAgreed(
			{
				fromBlock: fromBlockNumber || 0,
			},
			agreeListener
		);
	};

	$: agreeListener = (err, contractEvent) => {
		if (err) {
			console.error("Agree listen error", err);
			return;
		}
		const { event, returnValues, blockNumber } = contractEvent;
		const { name, fromAddress } = returnValues;
		console.log(
			`${event} emitted: ${name} agreed from ${fromAddress} (block #${blockNumber})`
		);

		const id = `#${name}`;
		//const id = `#thing`;
		const li = document.querySelector(id);
		if (li != null) {
			li.innerHTML = `${name} agreed (${fromAddress})`;
		}
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
			owner = await WeShakeApp.contract.methods.owner().call();
			terms = await WeShakeApp.contract.methods.terms().call();

			newTerms = terms;
			const blockNumber = await $web3.eth.getBlockNumber();
			listenToAgreements(blockNumber);
			listenToRegister(blockNumber);
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
				<ul id="members" class="bg-gray-300 p-4 rounded divide-y">
					{#each members as person}
						<li id={person.name}>
							{person.name}
							{person.agreed ? "agreed" : "has not agreed"} ({person.addr})
						</li>
					{/each}
				</ul>
			</div>

			{#if owner.toLowerCase() == $selectedAccount}
				<div class="flex justify-center items-center">
					<button
						on:click={toggleModal}
						class="bg-indigo-300 shadow-sm text-white text-sm font-medium px-4 py-3 rounded hover:bg-indigo-700"
						>Set Terms</button
					>
					{#if !isRegistered()}
						<button
							on:click={toggleRegisterModal}
							type="submit"
							class="bg-indigo-300 shadow-sm text-white text-sm font-medium px-4 py-3 border -ml-2 rounded rounded-l-none hover:bg-indigo-700"
						>
							Register
						</button>
					{:else if !hasAgreed()}
						<button
							on:click={agree}
							type="submit"
							class="bg-indigo-300 shadow-sm text-white text-sm font-medium px-4 py-3 border -ml-2 rounded rounded-l-none hover:bg-indigo-700"
						>
							Agree
						</button>
					{/if}
				</div>
				<div
					class="bg-black bg-opacity-50 inset-0 absolute hidden justify-center items-center"
					id="overlay"
				>
					<div
						class="bg-white py-2 px-2 rounded shadow-xl text-gray-800"
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
							<form>
								<div class="text-left">
									<textarea
										bind:value={newTerms}
										class="block bg-gray-200 text-sm border border-gray-400 focus:outline-none focus:bg-gray-100 focus:border-gray-300 rounded"
										name="terms"
									/>
								</div>
							</form>
						</div>
						<div class="mt-3 flex justify-end space-x-3">
							<button
								on:click={toggleModal}
								class="px-3 py-1 rounded hover:bg-red-300 hover:bg-opacity-40 hover:text-red-900"
								>Cancel</button
							>
							<button
								on:click={setTerms}
								class="px-3 py-1 rounded bg-red-800 text-gray-200 hover:bg-red-600 "
								>Submit</button
							>
						</div>
					</div>
				</div>
			{:else if !isRegistered()}
				<div class="flex justify-center">
					<button
						on:click={toggleRegisterModal}
						type="submit"
						class="py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded text-white bg-indigo-300 hover:bg-indigo-700"
					>
						Register
					</button>
				</div>
			{:else if !hasAgreed()}
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

			<div
				class="bg-black bg-opacity-50 inset-0 absolute hidden justify-center items-center"
				id="registerModal"
			>
				<div class="bg-white py-2 px-2 rounded shadow-xl text-gray-800">
					<div class="flex justify-between items-center">
						<h4 class="font-bold text-lg">Register</h4>
						<svg
							on:click={toggleRegisterModal}
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
						<form>
							<div class="text-left">
								<label>Name:</label>
								<input
									bind:value={name}
									class="block bg-gray-200 text-sm border border-gray-400 focus:outline-none focus:bg-gray-100 focus:border-gray-300 rounded"
									name="terms"
								/>
							</div>
						</form>
					</div>
					<div class="mt-3 flex justify-end space-x-3">
						<button
							on:click={toggleRegisterModal}
							class="px-3 py-1 rounded hover:bg-red-300 hover:bg-opacity-40 hover:text-red-900"
							>Cancel</button
						>
						<button
							on:click={register}
							class="px-3 py-1 rounded bg-red-800 text-gray-200 hover:bg-red-600 "
							>Submit</button
						>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<p>Not connected!</p>
	{/if}
</main>

<style>
</style>
