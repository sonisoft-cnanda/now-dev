import { OAuth } from '../../../src/auth/oauth/OAuth';

//import {  Creds } from '@servicenow/sdk-cli-core'
//import { generateRandomString } from '../../../test_utils/test_utils';
const SECONDS = 1000;

describe('Auth', () => {
   
    beforeEach(async () => {

       
    });

    afterEach(() => {
       
    });

    describe('OAuth', () => {
        beforeEach(async () => {
          
        });
    

        it('should open browser', async () => {
          const oauth:OAuth = new OAuth();
          oauth.openBrowserForAuth();
           
        
        }, 700 * SECONDS);

        afterEach(async () => {
           
        });

    });

   



});
