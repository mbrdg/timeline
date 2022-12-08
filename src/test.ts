import { importPKCS8, importSPKI } from "jose";

const alg = "RS256";
const pkcs8 = "-----BEGIN PRIVATE KEY-----" +
    "MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC1jWk6+8LaJL6B" +
    "4AAG2EsKPBfGQswPhKPkWt5aYwOEuKUamXnjplrHSzUuQEyLJxpgybR1uet5jJwV" +
    "MhDsNhav0MCCQ/NYSNIz92ChRPa6idCaww+fPfFEMA9mfPVqL7SLIuAyHbJUi6Is" +
    "/uk75F5ttrp9Mvgac2e96atURKSlIjAlQFvMoLZytRsPMTNyKFYDxVooZu0OHhLg" +
    "r6Ai/8VvNDkencuJRgnvT4ZLODRS4SLgDufDFwr4+FGsPhlo0pS/e/w7kSTu5gJa" +
    "0CVXp5W5DFosz1X9vUCK2YHOFgNjS+a24o4TVGSAEocSBzmf0mFF0XPRAJuxFQFq" +
    "Zxdd/ouNAgMBAAECggEAAadhHwVuF/ift6Unuug7fsNfYBH5s+Z8a7ccMWyXep0H" +
    "+/8L6jP4vboEqQAy8k2P4vPTbgMcjwXl4heLqeswN7fKGSWvUM2RBKIrQizTpo1c" +
    "1hwSx1uUGA/sA/39alM27NGLg0lb94MyHgDQdRg2d/9jIYLWWb9VYZiAVAswCMUM" +
    "BHu6wd4URV2oQjfGmNymzKvJdj6SrrQ96igU42i6SKTI7vuN1wYA//U9/BVwhRtA" +
    "T4sOWZNfXpKGNw41msXw3QFi8ZJhGKwFlV1lYkB8jewo/xlyefC+Y/RrOuJhEKy7" +
    "raNHurojw9+g6Cz5qK46QWwMSdMzY2dh9PgCT3JKYQKBgQDpmU1Xv+Ms/YO06LZc" +
    "GxuoI4URU9h08xgsVBpTo0yrmuSXfBhM4itSL0EuFE6qNLdWrwvhkabrFKwvW3Vt" +
    "NbcZ6u2tgqob13x87g7REj8ibj2z+hfP1OnCd9asOfP2peZCaSd49eaALiArsx5q" +
    "pRYZ1ZRpWd3OYJmVlz+vo223VQKBgQDG9mcezw/PKcDIZslkkvn065PYd+sfptkJ" +
    "+Ddeui665yY30XtHhHAKhuuisBVyulk3e3e04IMECu+aIkpRumCsmGpPK0GoKIOR" +
    "sc1xlMso7rw+vlGmJ3ICtMElouFSLx5Oz62hwwGe2NpwCaBpEfCfEOmMBUqXBmVl" +
    "q7fLckSTWQKBgQDAHARgWv2wfVk4iX2Xp++JypRf2K2WGGnT4uK3z/94zWybLEIr" +
    "0IDCGPyosai0D6CLmG/T9V3pzNmCJNwgkWFg3jTTUjclqITHlVv4EuJ7JWB3SAEX" +
    "Ocl41edlQk/hkzQXf7UnpEsJNWXdqnQkTlorqttf/LkORaFpRbbpciUD9QKBgQCH" +
    "BIuyMp3t3c2/sVEV+U+6z2tDSQ28KwO6akFY/Uvc9iPPWU8pl0xZOHoLqybC9oa4" +
    "ygbQLlN6mNlEZeS9VZdpSP1LwHUL4oJ2iox6eZjsrCX/BjRuZvJNt9Ai9Een9+W/" +
    "YdvYnHcrDsodocrDwrLhnx5+MNEPb/27Yy6U13SF8QKBgQCbdZXKtyUSjxS9/sYc" +
    "gkTcH3Z68M0fVYtJy+LIwiCGHHleKFYuNKoTtD8yzcDxXCX+hejFEZooUbQylNtv" +
    "frxEZnRdd0h+xgmPNJj//rnGKyC0FwuPjYk0oeCTQ2ZxZ2mNFvu9ajtymfmfMghm" +
    "PW5D0EdwBwlfze2mjbAg3SAEmg==" +
    "-----END PRIVATE KEY-----";


const privateKey = await importPKCS8(pkcs8, alg);
console.log(privateKey);

const alg2 = 'RS256'
const spki = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwhYOFK2Ocbbpb/zVypi9
SeKiNUqKQH0zTKN1+6fpCTu6ZalGI82s7XK3tan4dJt90ptUPKD2zvxqTzFNfx4H
HHsrYCf2+FMLn1VTJfQazA2BvJqAwcpW1bqRUEty8tS/Yv4hRvWfQPcc2Gc3+/fQ
OOW57zVy+rNoJc744kb30NjQxdGp03J2S3GLQu7oKtSDDPooQHD38PEMNnITf0pj
+KgDPjymkMGoJlO3aKppsjfbt/AH6GGdRghYRLOUwQU+h+ofWHR3lbYiKtXPn5dN
24kiHy61e3VAQ9/YAZlwXC/99GGtw/NpghFAuM4P1JDn0DppJldy3PGFC0GfBCZA
SwIDAQAB
-----END PUBLIC KEY-----`
const publicKey = await importSPKI(spki, alg2);
console.log(publicKey);