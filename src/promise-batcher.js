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
