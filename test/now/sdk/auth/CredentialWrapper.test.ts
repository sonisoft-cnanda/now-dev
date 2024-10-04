
import { CredentialWrapper } from '../../../../src/now/sdk/auth/CredentialWrapper'
import {  Creds } from '@servicenow/sdk-cli-core'
const SECONDS = 1000;

const characters ="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generateRandomString(length) {
    let result = " ";
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

describe('now.sdk.auth.CredentialsWrapper Integration Test', () => {
   const aliasList:string[] = [];
    beforeEach(async () => {

       
    });

    afterEach(() => {
       
    });

    describe('storeCredentials', () => {
        beforeEach(async () => {
            const generatedAlias:string = generateRandomString(10);
            if(generatedAlias){
                aliasList.push(generatedAlias);
            }
       
        });
    

        it('should get credential from credential store by alias', async () => {
            const generatedAlias:string = aliasList[aliasList.length-1];
           if(!generatedAlias)
            throw new Error("Alias cannot be null for test.");

           const wrapper:CredentialWrapper = new CredentialWrapper();
        
           //Note: Invalid credentials will cause the credential to not be added
           await wrapper.storeCredentials(generatedAlias, false, "https://ven01280.service-now.com", "chris.nanda", "D$adP00l$G$$k0ut");
           const credential:Creds = await wrapper.getStoredCredentialsByAlias(generatedAlias);

           expect(credential).not.toBeNull();
           
        
        }, 700 * SECONDS);

        afterEach(async () => {
            let generatedAlias:string | undefined;
            while((generatedAlias= aliasList.pop()) != undefined){
                if(generatedAlias){
                    const wrapper:CredentialWrapper = new CredentialWrapper();
                    const credential:Creds = await wrapper.getStoredCredentialsByAlias(generatedAlias);
                    if(credential){
                        await wrapper.removeCredentials(generatedAlias);
                    }
                    
                }
            }
        });

    });

    describe('updateDefaultCredential', () => {
       

        it('should get credential from credential store by alias', async () => {
           const wrapper:CredentialWrapper = new CredentialWrapper();
        
           const credential:Creds = await wrapper.getStoredCredentialsByAlias("fluent-default");

           expect(credential).not.toBeNull();
           
        
        }, 700 * SECONDS)

    });

    describe('getStoredCredentialsByAlias', () => {
       

        it('should get credential from credential store by alias', async () => {
           const wrapper:CredentialWrapper = new CredentialWrapper();
        
           const credential:Creds = await wrapper.getStoredCredentialsByAlias("fluent-default");

           expect(credential).not.toBeNull();
           
        
        }, 700 * SECONDS)

        it('should return null if credential for alias does not exist', async () => {
            const wrapper:CredentialWrapper = new CredentialWrapper();
         
            const credential:Creds = await wrapper.getStoredCredentialsByAlias("randTestAlias1778");
 
            expect(credential).toBeNull();
            
         
         }, 700 * SECONDS)

    });



});
