## Solidity scratchpad con Hardhat

#### Running tests ####
```
npx hardhat test
``` 
or
```
npx hardhat test test/testfile.ts
```

#### Deploy scripts ####
To deploy to local blockchain:

1. Run the hardhat network
```
npx hardhat node
```
2. Execute the deploy script(s).
```
npx hardhat run --network localhost ./scripts/somescript.ts
```
