const {assert} = require('chai');
const {utils, wallets} = require('@aeternity/aeproject');
const {AmountFormatter} = require('@aeternity/aepp-sdk');

const EXAMPLE_CONTRACT_SOURCE = './contracts/ExampleContract.aes';

describe('Put Raise Deal Test', () => {
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

        //get name order
        let {decodedResult: maxPrice} = await contract.methods.get_name_max_price(name);
        const {decodedEvents} = await contract.methods.put_name(name, delegationSignature, AmountFormatter.toAettos(100), 100, {amount: Number(maxPrice) / 100});
        assert.equal(decodedEvents[0].name, 'PutNameEvent');
        assert.equal(decodedEvents[0].args[0], wallets[0].publicKey);
        assert.equal(decodedEvents[0].args[1], name);
        assert.equal(decodedEvents[0].args[2], AmountFormatter.toAettos(100));
        assert.equal(decodedEvents[0].args[3], 100);
    })
    it('AensMarketContract: RaiseName: ' + name, async () => {

        for (let i = 0; i < 5; i++) {

            //get name order
            let {decodedResult: nameOrder} = await contract.methods.get_name_order(name);
            //get next amount
            let {decodedResult: nextNameRaisePrice} = await contract.methods.get_name_next_raise_price(nameOrder.left_amount);
            nextNameRaisePrice = AmountFormatter.toAettos(parseInt(AmountFormatter.toAe(Number(nextNameRaisePrice))) + 1)
            //raise
            const {decodedEvents} = await contract.methods.raise_name(name, {amount: Number(nextNameRaisePrice)});
            assert.equal(decodedEvents[0].name, 'RaiseNameEvent');
            assert.equal(decodedEvents[0].args[0], nameOrder.left_amount);
            assert.equal(decodedEvents[0].args[1], nextNameRaisePrice);


            let {decodedResult: nameOrderNew} = await contract.methods.get_name_order(name);
            console.log("           currentAmount___________________________ " + AmountFormatter.toAe(Number(nameOrderNew.current_amount)));
            console.log("           leftAmount______________________________ " + AmountFormatter.toAe(Number(nameOrderNew.left_amount)));
            console.log("           nextRaiseAmount_________________________ " + AmountFormatter.toAe(Number(nextNameRaisePrice)));
            console.log("           bonusFee________________________________ " + AmountFormatter.toAe(Number(decodedEvents[0].args[2])));
            console.log("           ");
        }

    })


    it('AensMarketContract: DealName: ' + name, async () => {
        await utils.awaitKeyBlocks(aeSdk, 10);
        const {result} = await contract.methods.deal_name(name);
        assert.equal(result.returnType, 'ok');
    })


    it('AensMarketContract: GetState', async () => {
        const {decodedResult: get_state} = await contract.methods.get_state();
        console.log(get_state);
    });
})

