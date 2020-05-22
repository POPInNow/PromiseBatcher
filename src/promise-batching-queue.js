/*
 * Copyright (C) 2019 POP Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

    const activeQueue = [];
    let waitingQueue = [];

    /**
     * Remove the item with the given id from the active queue
     * @private
     *
     * @param {string} id
     * @return {QueueObject|null} Item removed
     */
    const removeItemFromArray = (id) => {
      const queue = activeQueue;
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
    const notifyWaiting = () => {
      // The waiting queue has been notified, if a promise can run, do it
      if (activeQueue.length < maxSize) {
        if (waitingQueue.length > 0) {
          // Shift the first item out of the waiting queue
          const firstWaiting = waitingQueue.shift();
          firePromise(firstWaiting);
        }
      }
    }


    /**
     * Fire the promise from the queue object, and pass its resolve or reject back to the caller.
     * @private
     *
     * @param {QueueObject} queueObject
     */
    const firePromise = (queueObject) => {
      // Add it to the active queue and wait for it to finish
      activeQueue.push(queueObject);

      // Once the promise finishes, remove it from the queue and return to the caller
      const generator = queueObject.getPromiseGenerator();

      // This may be a promise, this may not be.
      // Its a promise according to spec if it has a then method.
      const potentialPromise = generator();
      let promise;
      if (!!potentialPromise.then) {
        // We have a then method, we're basically a promise
        promise = potentialPromise;
      } else {
        // I don't know what this is, but it's not a promise so resolve it as a Promise.
        // I hope you're using an ES6 Promise library in 2019.
        promise = Promise.resolve(potentialPromise);
      }

      promise.then(result => {
        const item = removeItemFromArray(queueObject.getId());
        if (item != null) {
          item.resolve(result);
        }

        // Now that the queue has been freed up, notify any waiting Promises
        notifyWaiting()
      }).catch(error => {
        const item = removeItemFromArray(queueObject.getId());
        if (item != null) {
          item.reject(error);
        }

        // Now that the queue has been freed up, notify any waiting Promises
        notifyWaiting()
      });
    }

    /**
     * If there is space in the activeQueue, fire the promise immediately, otherwise put it in waiting
     * @private
     *
     * @param {function} promiseGenerator
     * @return {Promise} A promise to chain off of
     */
    const queuePromise = (promiseGenerator) => {
      return new Promise((resolve, reject) => {
        // If there is room for this promise in the active queue
        const queueObject = new QueueObject(resolve, reject, promiseGenerator);
        if (activeQueue.length < maxSize) {
          firePromise(queueObject);
        } else {
          // If there is no room to run, add to the waiting queue
          waitingQueue.push(queueObject);
        }
      });
    };

    /**
     * Return the current size of the active queue
     * @return {number}
     */
    this.getActiveSize = () => {
      return activeQueue.length;
    }

    /**
     * Return the current size of the waiting queue
     * @return {number}
     */
    this.getWaitingSize = () => {
      return waitingQueue.length;
    }

    /**
     * Return the max size of the active queue
     * @return {number}
     */
    this.getMaxSize = () => {
      return maxSize;
    }

    /**
     * Clear the queues on demand
     */
    this.clear = () => {
      // Clear the waiting queue first, any active promises are already active and so will be finished
      // unless they are cancelled via other means.
      waitingQueue = [];
    }

    /**
     * Queue up a promise to fire when the Queue is available
     *
     * @param {function}promiseGenerator
     * @return {Promise} A promise to chain off of
     */
    this.queue = (promiseGenerator) => {
      if (!promiseGenerator) {
        throw Error('Must call queue() with a promiseGenerator function');
      }

      if (typeof(promiseGenerator) !== TYPE_FUNCTION) {
        throw Error('promiseGenerator argument must be a function');
      }

      return queuePromise(promiseGenerator);
    }
  }
}
