import { randomBytes, createCipheriv } from 'crypto';
const encryptSymmetric = (key, plaintext) => {
    const iv = randomBytes(12).toString('base64');
    const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'));
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    const tag = cipher.getAuthTag();
    return { ciphertext, tag };
};
//const plaintext = "encrypt me";
//const key = randomBytes(32).toString('base64');
//const { ciphertext, iv, tag } = encryptSymmetric(key, plaintext);
//# sourceMappingURL=encrypt.js.map