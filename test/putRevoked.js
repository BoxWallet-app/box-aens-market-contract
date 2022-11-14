const {assert} = require('chai');
const {utils, wallets} = require('@aeternity/aeproject');

const EXAMPLE_CONTRACT_SOURCE = './contracts/AensMarketContact.aes';

describe('PutRevoked Test', () => {
    let aeSdk;
    let contract;
    let contractId;
    let delegationSignature;
    let name = "abcdefghijklmnopqrstuvwxyz.chain";

    before(async () => {
        aeSdk = await utils.getSdk();

        // a filesystem object must be passed to the compiler if the contract uses custom includes
        const filesystem = utils.getFilesystem(EXAMPLE_CONTRACT_SOURCE);

        // get content of contract
        const source = utils.getContractContent(EXAMPLE_CONTRACT_SOURCE);

        // initialize the contract instance
        contract = await aeSdk.getContractInstance({source, filesystem});
        await contract.deploy();

        //get ct address
        contractId = contract.deployInfo.result.contractId

        // create a snapshot of the blockchain state
        await utils.createSnapshot(aeSdk);
    });

    // after each test roll back to initial state
    after(async () => {
        await utils.rollbackSnapshot(aeSdk);
    });

    // it('ExampleContract: get_state', async () => {
    //   const set = await contract.methods.set(42, { onAccount: wallets[1].publicKey });
    //   assert.equal(set.decodedEvents[0].name, 'SetXEvent');
    //   assert.equal(set.decodedEvents[0].args[0], wallets[1].publicKey);
    //   assert.equal(set.decodedEvents[0].args[1], 42);
    //
    //   const { decodedResult } = await contract.methods.get();
    //   assert.equal(decodedResult, 42);
    // });


    it('ClaimName: ' + name, async () => {
        const preClaim = await aeSdk.aensPreclaim(name);
        await preClaim.claim();
    })

    it('CreateAensDelegationSignature', async () => {
        delegationSignature = await aeSdk.createAensDelegationSignature({
            contractId: contractId,
            name: name,
        });
        assert.ok(true);
    })

    it('AensMarketContract: PutName: ' + name, async () => {
        const {decodedEvents} = await contract.methods.put_name(name, delegationSignature, 1000000, 100);
        assert.equal(decodedEvents[0].name, 'PutNameEvent');
        assert.equal(decodedEvents[0].args[0], wallets[0].publicKey);
        assert.equal(decodedEvents[0].args[1], name);
        assert.equal(decodedEvents[0].args[2], 1000000);
        assert.equal(decodedEvents[0].args[3], 100);
    })
     it('AensMarketContract: RevokedName: ' + name, async () => {
        const {decodedEvents} = await contract.methods.revoked_name(name);
        assert.equal(decodedEvents[0].name, 'RevokedNameEvent');
        assert.equal(decodedEvents[0].args[0], wallets[0].publicKey);
        assert.equal(decodedEvents[0].args[1], name);
    })

    // it('ExampleContract: get_state', async () => {
    //     const {decodedResult: get_state} = await contract.methods.get_state();
    //     console.log(get_state.config);
    //     // assert.equal(decodedResult, undefined);
    // });
});
