// AC @ M.EIC, 2022
// SDLE, T4G14
import { createHash } from "crypto";


export default class Node {

    readonly id: string;

    constructor(ip: string, port: number) {
        this.id = createHash('sha1')
            .update(ip)
            .update(port.toString())
            .digest('hex')
    }
}