import { assert } from 'console'
import { NearBindgen, call, view, near } from 'near-sdk-js'

class Land {
    id: number
    price: number
    ownerName: string
    ownerAddress: string
    buyerAllowed: string

    constructor(id: number, price: number, ownerName: string, ownerAddress: any) {
        //execute the NEAR Contract's constructor
        this.id = id
        this.price = price
        this.ownerName = ownerName
        this.ownerAddress = ownerAddress
        this.buyerAllowed = ''
    }
}

// The @NearBindgen decorator allows this code to compile to WebAssembly.
@NearBindgen({})
class PropertyListing{
    admin: string
    count: number //no. of properties
    lands: Land[] = [] //array having all lands

    constructor() {
        //execute the NEAR Contract's constructor
        const sender = near.predecessorAccountId()
        this.admin = sender
    }

    default() {
        return new PropertyListing()
    }

    @view({})
    getProperty({ id, price }: { id: number; price: number }) {
        let l: Land = this.lands[id - 1]
        return l
    }

    @view({})
    getProperties() {
        return this.lands
    }

    @call({})
    changePrice({ id, price }: { id: number; price: number }) {
        let l: Land = this.lands[id - 1]
        l.price = price
    }
    @call({})
    buyLand({ id, newName }: { id: number; newName: string }) {
        // const amount = near.attachedDeposit() >= BigInt(POINT_ONE);
        const sender = near.predecessorAccountId()
        //sender allowed to buy
        let l: Land = this.lands[id - 1]
        const amount = near.attachedDeposit()
        assert(l.buyerAllowed == sender, `incorrect buyer`)

        assert(amount >= l.price, `incorrect amount`)

        //transfer tokens to owner
        const promise = near.promiseBatchCreate(l.ownerAddress);
        near.promiseBatchActionTransfer(promise, l.price);
        //transfer ownership
        l.ownerAddress = sender;
        l.ownerName = newName;
        l.buyerAllowed = '';
    }

    @call({})
    listLand({ price, ownerName }: { price: number; ownerName: string }) {
        //allowed to buy

        // near.log(`Saving greeting ${message}`);
        // this.myGreeting = message;

        // const premium = near.attachedDeposit() >= BigInt(POINT_ONE);
        const sender = near.predecessorAccountId()
        this.count++
        let c: number = this.count
        const l = new Land(c, price, ownerName, sender)
        this.lands.push(l)
    }

    allowBuyer({ buyerAllowedAddress, id }: { buyerAllowedAddress: string; id: number }) {
        let l: Land = this.lands[id - 1]
        l.buyerAllowed = buyerAllowedAddress
    }
}
