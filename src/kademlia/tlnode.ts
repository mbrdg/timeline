// SDLE @ M.EIC, 2022
// T4G14
import { createHash } from "crypto";


export default class TLNode {

    readonly id: string;
    private readonly startup = new Date();

    constructor(readonly ip: string, readonly port: number) {
        this.id = createHash('sha1')
            .update(ip)
            .update(port.toString())
            .digest('hex')
    }

    uptime() {
        const now = new Date();
        return now.getTime() - this.startup.getTime();
    }
}