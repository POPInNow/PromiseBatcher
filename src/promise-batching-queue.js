import { QueueObject } from './queue-object';
import { TYPE_FUNCTION } from './constants';

export class PromiseBatchingQueue {

  constructor (maxSize) {
    if (Promise === undefined || Promise === null || !Promise) {
      throw Error('Promise is not found in the global scope! Cannot use PromiseBatcher.');
    }

    if (maxSize <= 0) {
      throw Error('maxSize must be greater than 0');
    }

    this.__maxSize = maxSize;
    this.__activeQueue = [];
    this.__waitingQueue = [];

    this.__notifyWaiting = this.__notifyWaiting.bind(this);
    this.__firePromise = this.__firePromise.bind(this);
    this.__queuePromise = this.__queuePromise.bind(this);
    this.__removeItemFromArray = this.__removeItemFromArray.bind(this);

    this.queue = this.queue.bind(this);
    this.getActiveSize = this.getActiveSize.bind(this);
    this.getWaitingSize = this.getWaitingSize.bind(this);
    this.getMaxSize = this.getMaxSize.bind(this);
  }

  /**
   * Return the current size of the active queue
   * @return {number}
   */
  getActiveSize () {
    return this.__activeQueue.length;
  }

  /**
   * Return the current size of the waiting queue
   * @return {number}
   */
  getWaitingSize () {
    return this.__waitingQueue.length;
  }

  /**
   * Return the max size of the active queue
   * @return {number}
   */
  getMaxSize () {
    return this.__maxSize;
  }

  /**
   * Remove the item with the given id from the active queue
   * @private
   *
   * @param {string} id
   * @return {QueueObject|null} Item removed
   */
  __removeItemFromArray (id) {
    const queue = this.__activeQueue;
    const size = queue.length;
    for (let i = 0; i < size; ++i) {
      const item = queue[i];
      if (id === item.getId()) {
        queue.splice(i, 1);
        return item;
      }
    }

    return null;
  };

  /**
   * Notify any waiting members in the queue if there is space in the active queue
   * @private
   */
  __notifyWaiting () {
    // The waiting queue has been notified, if a promise can run, do it
    if (this.__activeQueue.length < this.__maxSize) {
      if (this.__waitingQueue.length > 0) {
        // Shift the first item out of the waiting queue
        const firstWaiting = this.__waitingQueue.shift();
        this.__firePromise(firstWaiting);
      }
    }
  }

  /**
   * Fire the promise from the queue object, and pass its resolve or reject back to the caller.
   * @private
   *
   * @param {QueueObject} queueObject
   */
  __firePromise (queueObject) {
    // Add it to the active queue and wait for it to finish
    this.__activeQueue.push(queueObject);

    // Once the promise finishes, remove it from the queue and return to the caller
    const generator = queueObject.getPromiseGenerator();
    generator().then(result => {
      const item = this.__removeItemFromArray(queueObject.getId());
      if (item != null) {
        item.resolve(result);

        // Now that the queue has been freed up, notify any waiting Promises
        this.__notifyWaiting();
      }
    }).catch(error => {
      const item = this.__removeItemFromArray(queueObject.getId());
      if (item != null) {
        item.reject(error);

        // Now that the queue has been freed up, notify any waiting Promises
        this.__notifyWaiting();
      }
    });
  }

  /**
   * If there is space in the activeQueue, fire the promise immediately, otherwise put it in waiting
   * @private
   *
   * @param {function} promiseGenerator
   * @return {Promise} A promise to chain off of
   */
  __queuePromise (promiseGenerator) {
    return new Promise((resolve, reject) => {
      // If there is room for this promise in the active queue
      const queueObject = new QueueObject(resolve, reject, promiseGenerator);
      if (this.__activeQueue.length < this.__maxSize) {
        this.__firePromise(queueObject);
      } else {
        // If there is no room to run, add to the waiting queue
        this.__waitingQueue.push(queueObject);
      }
    });
  };

  /**
   * Queue up a promise to fire when the Queue is available
   *
   * @param {function}promiseGenerator
   * @return {Promise} A promise to chain off of
   */
  queue (promiseGenerator) {
    if (!promiseGenerator) {
      throw Error('Must call queue() with a promiseGenerator function');
    }

    if (typeof(promiseGenerator) !== TYPE_FUNCTION) {
      throw Error('promiseGenerator argument must be a function');
    }

    return this.__queuePromise(promiseGenerator);
  }

}
