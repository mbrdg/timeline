// SDLE @ M.EIC, 2022
// T4G14

import { TLUserHandle } from "../tluser.js";

export default interface TLConnection {
    readonly from: TLUserHandle,
    readonly to: TLUserHandle,
}