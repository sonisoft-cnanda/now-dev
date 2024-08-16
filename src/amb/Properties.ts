export class Properties{
	private static _instance:Properties;

	/**
		 * The static getter that controls access to the singleton instance.
		 *
		 * This implementation allows you to extend the Singleton class while
		 * keeping just one instance of each subclass around.
		 */
	public static get instance(): Properties {
		if (!Properties._instance) {
			Properties._instance = new Properties();
		}

		return Properties._instance;
	}

	public servletPath = "amb";
	public logLevel =  "debug";
	public loginWindow = "false";
	public wsConnectTimeout =  10000;
	public overlayStyle =  "";
	public subscribeCommandsFlow:any = { /* glide.amb.client.subscribe.commands.flow.* ... */
		enable: false,
		maxInflight: 1,
		maxWait: 10000,
		retries: 3,
		retryDelay: {
			min: 2000,
			max: 300000,
			increaseFactor: 2
		}
	}

}