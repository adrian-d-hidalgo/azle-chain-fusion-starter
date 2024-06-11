clean :; forge clean

install :;
	forge install foundry-rs/forge-std@v1.8.2
	forge install OpenZeppelin/openzeppelin-contracts@v5.0.2

update :; forge update
