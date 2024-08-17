import {createDecipheriv} from 'crypto';


const decryptSymmetric = (key, ciphertext, iv, tag) => {
    const decipher = createDecipheriv(
      "aes-256-gcm", 
      Buffer.from(key, 'base64'),
      Buffer.from(iv, 'base64')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
  
    let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');
  
    return plaintext;
  }
  
  //const plaintext = decryptSymmetric(key, ciphertext, iv, tag);