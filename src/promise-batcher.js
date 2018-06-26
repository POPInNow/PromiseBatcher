import { PromiseBatchingQueue } from './promise-batching-queue';

export class PromiseBatcher {

  constructor () {
    throw Error('Not allowed: Cannot construct instance of PromiseBatcher');
  }

  /**
   * Returns a new eager acting queue
   *
   * The promise queue will run as many promises as it can up to the maxSize
   * concurrently in a FIFO order.
   *
   * @param {number=4} maxSize
   * @return {PromiseBatchingQueue}
   */
  static newEagerQueue (maxSize = 4) {
    if (maxSize <= 0) {
      throw Error('maxSize must be greater than 0');
    }

    return new PromiseBatchingQueue(maxSize);
  }

  /**
   * Returns a new queue which will run promises serially in FIFO order
   * @return {PromiseBatchingQueue}
   */
  static newSerialQueue () {
    return new PromiseBatchingQueue(1);
  }

}

/**
 * Export as the default too
 */
export default PromiseBatcher;
