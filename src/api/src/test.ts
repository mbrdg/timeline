import { importPKCS8, importSPKI, CompactSign, compactVerify } from "jose";

const alg = "RS256";
const pkcs8 = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDQMtRKc3atL0Af
AWS38Tlye/1Ob8jIrFwNt2eHpWrDqRC6rWwt0f8Ro9ByigHKNCBnTUpx0DCf8DkI
kWhvW1+Jj/O7rxOLlSYSMiHX0LciGtCoFzL3+6frkpXXcJbO5rSo+z5HLOldGMgg
Km0QNd6mEe8S7fUj4V4bISzQrD3HLMYHxmkUO/MsXEcLoQVnWXsAjAVaul6nfwU3
XOHfpt9KYPrbSGDoX/vWZjYu6aGfnPDADKNrgwmNn3GBhDehwTrKXWdwLD3df4H7
bDgddB6tMSgLkOff1/qM4Tuc7bDNDzemxYJ9Y48Tshgb5C64B6QfXqvcYSx6chs6
nBFAkoL5AgMBAAECggEAewC8uWuz/qd+y5KoLaBfn0qvoeqbBiwGirgDe3l4NTaq
Qo/47K03c/WDTlhIrGzVhBJ+2/Ty9VsYZv55Y+jo7b3VctoBwyKQBooFwpp1x7lt
8xEZtLbCQ4Qr8Md84aodrAQbjDN1f+IHQjGuk7gv3Y+U3mslvFgGoCKedn58VTIF
r0mei5fJNcTcqJY/XZCzwE9dXvA4chk4UOpALcA6U+E4S4p1jFsxKIo87K4Nk9ZF
2E/CU/lLy8LNaDQIb407GsbcyidjYPi9IAxVVtcuoK9PSPTWLf2ujlJlnAr1QEtJ
BYzpnkak1SQ4esuPEHiAPkWI8a42mXVpDbOKwe6SDQKBgQD9FZ8vFNMK7lOTnOFC
w3yczUMvCCP5zOpLTzMRsn9c3Ysr22ysfyRPvKTouWj86y9WbMFUUESZczZGW0dB
oYKd95cRemxcuwv/hvuRXE+zn2xWWpaN/kSyJbAcp/04wuEh9W1dHru7giQL9Ol9
XSPTz0KiFLaOPhAVprqBeMGppwKBgQDSmNVNNBHzbPvFqjIjG0v7mJa+1fBj89i9
CjrZ3NGpf/PlwIT1RgHooFI8SEB86oNe6+95bF9Yl2iPJTJ6I6wofw6eQl1+Qp3W
WkY8CH/UOkXaop9/jlWci0kineYL/uI00Ler2e+1ZN2isDL3XCYlBHdP1ibZ0rNl
TTzBHTzCXwKBgCSwpsQvk6zpAirLOojwSDd/NncyCe0j/O9wCupM41P2Nj/kbqvP
PtdkdM/cWVEZU2KHH7v2awuH/V1TzE/Cd2opQ7hf9Ce5YjLoQb5AELnsqcsXFO5+
5zygZBizbe11qye+Kd2vH+4+HrWxCsyG3TPOv006DYEvlCtfYXh1pjXPAoGANSmf
rv2WCn1YkW2FepdJdxnt8/7N0G2eKRqMALNdugwy5azT45bopHDUUaNrpB0PTMcC
jQRujU6rdndNZsfajd6FMi5Oq7DlZ1cio8UBf/G18Jtc6DZmJj6DF9oEWMLfF7YY
p6k8ee4chRU1yHvapT2bYOwOoq4t20TEMXvP+sECgYBycLpwh6z5awB/E4/WGcN2
uv43fu3UKRhnirWHwW0ijGP5OLDs1ej5vY+P6y02Q5QmRa9hth+wCmo++qHpZHIp
JXvWi0v1PV79pgJKfPC/SyppuHZt8Pz1/fnZr5uB4NEUSucf5dEFy06aY5XsyAoa
IoJpUlhuzjiacqjocizuqw==
-----END PRIVATE KEY-----
`;

const privateKey = await importPKCS8(pkcs8, alg);
console.log(privateKey);

const alg2 = 'RS256'
    const spki = `-----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0DLUSnN2rS9AHwFkt/E5
    cnv9Tm/IyKxcDbdnh6Vqw6kQuq1sLdH/EaPQcooByjQgZ01KcdAwn/A5CJFob1tf
    iY/zu68Ti5UmEjIh19C3IhrQqBcy9/un65KV13CWzua0qPs+RyzpXRjIICptEDXe
    phHvEu31I+FeGyEs0Kw9xyzGB8ZpFDvzLFxHC6EFZ1l7AIwFWrpep38FN1zh36bf
    SmD620hg6F/71mY2Lumhn5zwwAyja4MJjZ9xgYQ3ocE6yl1ncCw93X+B+2w4HXQe
    rTEoC5Dn39f6jOE7nO2wzQ83psWCfWOPE7IYG+QuuAekH16r3GEsenIbOpwRQJKC
    +QIDAQAB
    -----END PUBLIC KEY-----
`;
const publicKey = await importSPKI(spki, alg2);
console.log(publicKey);

// const postContent = {
//     content: ":rocket:",
//     topics: ["niceRockets"]
// };

// const repostContent = {
//     id: "baejbeibixq2tgdenaqmyjwqrc4d4w3u3gcxrr4ocp4ezcebh3t7x7ldnxi"
// };

const followContent = {
    to: "@tigas2"
}
const signature = await new CompactSign(
  new TextEncoder().encode(JSON.stringify(followContent))
)
    .setProtectedHeader({ alg: alg2 })
    .sign(privateKey);

console.log(signature);

const body = {
    handle: "@tigas",
    content: signature,
}

const content = await compactVerify(body.content, publicKey)
    .then(res => new TextDecoder().decode(res.payload));
console.log(content);
