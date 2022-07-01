const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {
	developmentChains,
	networkConfig,
} = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
	? describe.skip
	: describe("Raffle Staging tests", function () {
			let raffle, raffleEntranceFee, deployer;

			beforeEach(async function () {
				deployer = (await getNamedAccounts()).deployer;
				raffle = await ethers.getContract("Raffle", deployer);
				raffleEntranceFee = await raffle.getEntranceFee();
			});

			describe("fulfillRandomWords", function () {
				it("works with live chainlink keepers and we get a random winner", async function () {
					console.log("Setting up test...");
					const startingTimeStamp = await raffle.getLatestTimeStamp();
					const accounts = await ethers.getSigners();
					// set up listener before enter the raffle
					console.log("Setting up listener");
					await new Promise(async (resolve, reject) => {
						raffle.once("WinnerPicked", async () => {
							console.log("Winner picked event fired");
							try {
								const recentWinner =
									await raffle.getRecentWinner();
								const raffleState =
									await raffle.getRaffleState();
								const winnerEndingBalance =
									await accounts[0].getBalance();
								const endingTimeStamp =
									await raffle.getLatestTimeStamp();

								await expect(raffle.getPlayer(0)).to.be
									.reverted;
								assert.equal(
									recentWinner.toString(),
									accounts[0].address
								);
								assert.equal(raffleState, 0);
								assert.equal(
									winnerEndingBalance.toString(),
									winnerStartingBalance
										.add(raffleEntranceFee)
										.toString()
								);
								assert(endingTimeStamp > startingTimeStamp);
								resolve();
							} catch (e) {
								console.log(e);
								reject(e);
							}
						});
						console.log("Entering raffe");
						const tx = await raffle.enterRaffle({
							value: raffleEntranceFee,
						});
						await tx.wait(1);
						console.log("Waiting...");
						const winnerStartingBalance =
							await accounts[0].getBalance();
					});
				});
			});
	  });
