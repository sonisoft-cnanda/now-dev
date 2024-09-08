
import { CredentialWrapper } from '../../../../src/now/sdk/auth/CredentialWrapper'
import {  Creds } from '@servicenow/sdk-cli-core'
import { generateRandomString } from '../../../test_utils/test_utils';
const SECONDS = 1000;

describe('now.sdk.auth.CredentialsWrapper Integration Test', () => {
   const aliasList:string[] = [];
    beforeEach(async () => {

       
    });

    afterEach(() => {
       
    });

    describe('storeCredentials', () => {
        beforeEach(async () => {
            let generatedAlias:string = generateRandomString(10);
            if(generatedAlias){
                aliasList.push(generatedAlias);
            }
       
        });
    

        it('should get credential from credential store by alias', async () => {
            let generatedAlias:string = aliasList[aliasList.length-1];
           if(!generatedAlias)
            throw new Error("Alias cannot be null for test.");

           let wrapper:CredentialWrapper = new CredentialWrapper();
        
           //Note: Invalid credentials will cause the credential to not be added
           await wrapper.storeCredentials(generatedAlias, false, "https://ven01280.service-now.com", "chris.nanda", "D$adP00l$G$$k0ut");
           let credential:Creds = await wrapper.getStoredCredentialsByAlias(generatedAlias);

           expect(credential).not.toBeNull();
           
        
        }, 700 * SECONDS);

        afterEach(async () => {
            let generatedAlias:string | undefined;
            while((generatedAlias= aliasList.pop()) != undefined){
                if(generatedAlias){
                    let wrapper:CredentialWrapper = new CredentialWrapper();
                    let credential:Creds = await wrapper.getStoredCredentialsByAlias(generatedAlias);
                    if(credential){
                        await wrapper.removeCredentials(generatedAlias);
                    }
                    
                }
            }
        });

    });

    describe('updateDefaultCredential', () => {
       

        it('should get credential from credential store by alias', async () => {
           let wrapper:CredentialWrapper = new CredentialWrapper();
        
           let credential:Creds = await wrapper.getStoredCredentialsByAlias("fluent-default");

           expect(credential).not.toBeNull();
           
        
        }, 700 * SECONDS)

    });

    describe('getStoredCredentialsByAlias', () => {
       

        it('should get credential from credential store by alias', async () => {
           let wrapper:CredentialWrapper = new CredentialWrapper();
        
           let credential:Creds = await wrapper.getStoredCredentialsByAlias("fluent-default");

           expect(credential).not.toBeNull();
           
        
        }, 700 * SECONDS)

    });



});
