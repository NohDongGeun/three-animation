import Hex from "crypto-js/enc-hex";
import AES from "crypto-js/aes";
import WordArray from "crypto-js/lib-typedarrays";
import {Buffer} from "buffer"

export function convertWordArrayToUint8Array(wordArray) {
    const arrayOfWords = wordArray.hasOwnProperty("words") ? wordArray.words : [];
    const length = wordArray.hasOwnProperty("sigBytes") ? wordArray.sigBytes : arrayOfWords.length * 4;
    const uInt8Array = new Uint8Array(length);
    let index = 0;
    let word;

    for (let i=0; i<length; i++) {
        word = arrayOfWords[i];
        uInt8Array[index++] = word >> 24;
        uInt8Array[index++] = (word >> 16) & 0xff;
        uInt8Array[index++] = (word >> 8) & 0xff;
        uInt8Array[index++] = word & 0xff;
    }
    return uInt8Array;
}

export function toBuffer(arrayBuffer) {
    const buffer = new Buffer(arrayBuffer.byteLength);
    const view = new Uint8Array(arrayBuffer);

    for (let i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }
    return buffer;
}

export async function decryptAesFromHex(hexData) {
    return new Promise((resolve, reject) => {
        const buffer = toBuffer(convertWordArrayToUint8Array(Hex.parse(hexData)));

        decryptData2Buffer(
            Buffer.from(import.meta.env.VITE_AES_SECRET_KEY).toString('hex'),
            buffer.slice(0, 16).toString('hex'),
            buffer.slice(16, 80)
        ).then(decryptedCredBlock => {
            return decryptData2Buffer(
                decryptedCredBlock.slice(16, decryptedCredBlock.length).toString('hex'),
                decryptedCredBlock.slice(0, 16).toString('hex'),
                buffer.slice(80, buffer.length)
            )
        }).then(decryptedBuffer => {
            resolve(decryptedBuffer.toString());
        }).catch(error => reject(error));
    });
}

async function decryptData2Buffer(key, iv, encDataBuffer) {
    return new Promise((resolve) => {
        const dec = AES.decrypt(
            {ciphertext: WordArray.create(encDataBuffer)},
            Hex.parse(key),
            {iv: Hex.parse(iv)}
        );

        resolve(toBuffer(convertWordArrayToUint8Array(dec).buffer));
    });
}

function toArrayBuffer(buffer) {
    const ab = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(ab);

    for (let i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}

export async function decryptModelFile(fileArrayBuffer) {
    return new Promise((resolve, reject) => {
        const buffer = toBuffer(fileArrayBuffer);

        decryptData2Buffer(
            Buffer.from(import.meta.env.VITE_AES_SECRET_KEY).toString('hex'),
            buffer.slice(0, 16).toString('hex'),
            buffer.slice(16, 80)
        ).then(decryptedCredBlock => {
            return decryptData2Buffer(
                decryptedCredBlock.slice(16, decryptedCredBlock.length).toString('hex'),
                decryptedCredBlock.slice(0, 16).toString('hex'),
                buffer.slice(80, buffer.length)
            )
        }).then(decryptedBuffer => {
            resolve(toArrayBuffer(decryptedBuffer));
        }).catch(error => reject(error));
    });
}
