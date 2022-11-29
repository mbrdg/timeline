// SDLE @ M.EIC, 2022
import { createServer } from "http";
import Node from "./kademlia/node";

const port = 8000;
const self = new Node('localhost', port);

createServer((req, res) => {

    const { method, url } = req;

    if (method === 'GET' && url === '/id') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.write(self.id)
        res.end()
    }

    res.writeHead(404);
    res.end();

}).listen(port)

