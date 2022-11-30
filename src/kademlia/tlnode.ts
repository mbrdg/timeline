// SDLE @ M.EIC, 2022
// T4G14
import { createHash } from "crypto";


export default class TLNode {

    readonly id: string;

    constructor(readonly ip: string, readonly port: number) {
        this.id = createHash('sha1')
            .update(ip)
            .update(port.toString())
            .digest('hex')
    }
}