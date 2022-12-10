// SDLE @ M.EIC, 2022
// T4G14

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const cli = yargs(hideBin(process.argv))
    .usage('Usage: $0 <command> [options]')
    .command('serve', 'start the local server')
    .option('port', {
        alias: 'p',
        describe: 'port to listen on',
        type: 'number',
        default: 8000,
    })
    .demandCommand()
    .epilog('Timeline @ SDLE, 2022')
    .parseSync();

export default cli;