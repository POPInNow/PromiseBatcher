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

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { PromiseBatchingQueue } from '../src/promise-batching-queue';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('PromiseBatchingQueue constructor Test', () => {
  const queue = new PromiseBatchingQueue(4);

  it('Sizes start at 0', () => {
    expect(queue.getActiveSize()).to.equal(0);
    expect(queue.getWaitingSize()).to.equal(0);
  });

  it('Max size from constructor', () => {
    expect(queue.getMaxSize()).to.equal(4);
  });
});

describe('PromiseBatchingQueue queue() Parameters', () => {
  const queue = new PromiseBatchingQueue(4);
  it('queue() is sane', () => {
    expect(queue.queue).to.be.a('function');
  });
  it('queue() expects an argument', () => {
    expect(() => queue.queue()).to.throw();
  });
  it('queue() expects a function argument', () => {
    expect(() => queue.queue(1)).to.throw();
  });
  it('queue() accepts a function argument', () => {
    expect(() => queue.queue(() => Promise.resolve(true))).to.not.throw();
  });
});

describe('PromiseBatchingQueue() queue test', () => {
  const delayedPromiseGenerator = (time, what) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(what || true);
      }, time);
    });
  };

  // Size updates immediately even though Promise may not be done
  const queueAndCheck = (queue, active, waiting) => {
    queue.queue(() => delayedPromiseGenerator(10));
    expect(queue.getActiveSize()).to.equal(active);
    expect(queue.getWaitingSize()).to.equal(waiting);
  };

  /**
   * When the active queue fills up, promises sit in waiting
   * @type {PromiseBatchingQueue}
   */
  it('Active Queue overflows into waiting', () => {
    const QUEUE_MAX = 4;
    const TEST_COUNT = 800;
    const queue1 = new PromiseBatchingQueue(QUEUE_MAX);
    for (let i = 0; i < TEST_COUNT; ++i) {
      const active = Math.min(QUEUE_MAX, i + 1);
      const waiting = Math.max(0, (i + 1) - QUEUE_MAX);
      queueAndCheck(queue1, active, waiting);
    }
  });

  /**
   * The queue overflows but eventually clears the overflow and resolves all callers
   * @type {PromiseBatchingQueue}
   */
  it('Active Queue overflows eventually clears out', () => {
    const QUEUE_MAX = 4;
    const TEST_COUNT = 600;
    const queue2 = new PromiseBatchingQueue(QUEUE_MAX);
    let result = [];

    for (let i = 1; i < TEST_COUNT; ++i) {
      result.push(expect(queue2.queue(() => delayedPromiseGenerator(10, i))).eventually.equal(i))
    }

    return Promise.all(result);
  });

  /**
   * Queue handles errors when they occur by returning them to caller
   * @type {PromiseBatchingQueue}
   */
  it('Queue beacons errors', () => {
    const queue3 = new PromiseBatchingQueue(4);
    return expect(queue3.queue(() => {
      return Promise.resolve(true).then(() => {
        throw Error('Error');
      });
    })).be.rejected;
  });

  /**
   * Even if an error occurs resolving one promise in the queue, it does not affect any other promises
   * @type {PromiseBatchingQueue}
   */
  it(`Queue doesn't stop on error`, () => {
    const queue4 = new PromiseBatchingQueue(4);
    return (
      expect(queue4.queue(() => delayedPromiseGenerator(100))).eventually.be.fulfilled &&
      expect(queue4.queue(() => {
        return Promise.resolve(true).then(() => {
          throw Error('Error');
        });
      })).be.rejected &&
      expect(queue4.queue(() => delayedPromiseGenerator(100, 'test'))).eventually.equal('test') &&
      expect(queue4.queue(() => delayedPromiseGenerator(100, 'library')))
        .eventually
        .equal('library')
    );
  });
});
