export class CrossClientChannel {


	emit = (eventName:any, message:any) => {
		// window.localStorage.setItem(eventName, JSON.stringify(message));
		// window.localStorage.removeItem(eventName);
	};

	on = (eventName:any, listener:any) => {
		// window.addEventListener('storage', ({key, newValue}) => {
		// 	if (key === eventName && newValue) {
		// 		listener(JSON.parse(newValue));
		// 	}
		// });
	};

}

