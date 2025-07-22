
type ContextMock = {
    secrets?:SecretsMock;
    subscriptions?:any;
    workspaceState?:any;
    globalState?:any;
    extensionUri?:any;
    extensionPath?:any;

}

type SecretsMock = {
    store();
    get():any;
}

describe.skip('AuthSettings', () => {
   
    xit('get password', async () => {
        // let context:ContextMock = {} as ContextMock;
        // AuthSettings.init(context as ExtensionContext);
        //  let settings:AuthSettings = AuthSettings.instance;



    })

    //TODO: Change from vs code check
    xit('set password', async () => {

        // const sstorage : Partial<SecretStorage> = {
          
        //   store: (key: string, value:string) : Thenable<void> => {
        //     return null;
        //   },
        //   get: (key:string) : Thenable<string> => {
        //     return null;
        //   }

        // };

        // const mockContext : Partial<ExtensionContext> = {
        //   secrets:sstorage as SecretStorage,
        // };

        // let password:string = "TestPassword";
        // //let context:ContextMock = {} as ContextMock;
        // //let mock:unknown = context as unknown;
        // AuthSettings.init(mockContext as ExtensionContext);
        // let settings:AuthSettings = AuthSettings.instance;

        // settings.storePassword("test", password);

    })
    
   
})