
export class FunctionQueue{
	 static _defaultMaxFunctionQueueSize = 0x7ffffff;  // pseudo-infinity: max 32-bit signed int


	queueBuffer:any[] = [];
	maxQueueSize:number;

	/**
	 * Models a simple function queue
	 * @param queueSize the maximum allowed queue size
	 */
	public constructor(queueSize:number = FunctionQueue._defaultMaxFunctionQueueSize){
		this.maxQueueSize = Math.max(1, Math.floor(queueSize));
	}

	/**
	 * Adds an item to this queue.
	 * @param item  item to add to this queue
	 * @returns  true if the item was added; otherwise false (queue is full)
	 **/
	public enqueue (item:any) : any {
		if (this.getAvailableSpace() > 0) {
			this.queueBuffer.push(item);
			return true;
		}
		return false;
	}

	/**
	 * Adds multiple items to this queue.
	 * @param items  items to add to this queue
	 * @returns  true if all the items were added; false if insufficient room
	 */
	public enqueueMultiple(items:any) : any {
		if (this.getAvailableSpace() >= items.length) {
			this.queueBuffer = this.queueBuffer.concat(items);
			return true;
		}
		return false;
	}

	/**
	 * Removes and returns an item from this queue.
	 * @returns  the item removed; otherwise an undefined is returned
	 */
	public dequeue() : any {
		let result;
		if (this.queueBuffer.length > 0)
			result = this.queueBuffer.shift();

		return result;
	}

	/**
	 * Removes and returns up to a specified number of items from this queue.
	 * @param count the # of items to remove (if more than contained in queue or negative, undefined is returned)
	 * @returns  an array of containing the items removed, or undefined if count is out of range.
	 */
	public dequeueMultiple(count:any) : any {
		let retbuf;
		if (count >= 0) {
			if (this.queueBuffer.length >= count) {
				retbuf = [];
				if (count > 0) {
					retbuf = this.queueBuffer.slice(0, count);
					this.queueBuffer =this.queueBuffer.slice(count);
				}
			}
		}
		return retbuf;
	}

	/**
	 * Removes all items from this queue.
	 */
	public clear () {
		this.queueBuffer = [];
	}

	/**
	 * Returns the # of items in this queue.
	 * @returns  the # of items in this queue.
	 */
	public getSize () {
		return this.queueBuffer.length;
	}

	/**
	 * Returns the maximum capacity of this queue.
	 * @returns  the maximum capacity of this queue.
	 */
	public getCapacity() {
		return this.maxQueueSize;
	}

	/**
	 * Returns the space currently available for more items.
	 * @returns  the space currently available for more items.
	 */
	public getAvailableSpace () {
		return (this.maxQueueSize - this.queueBuffer.length);
	}
	
	public getQueueBuffer() {
		return this.queueBuffer;	
	}
}
