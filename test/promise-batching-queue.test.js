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
    queue.queue(() => delayedPromiseGenerator(100));
    expect(queue.getActiveSize()).to.equal(active);
    expect(queue.getWaitingSize()).to.equal(waiting);
  };

  /**
   * When the active queue fills up, promises sit in waiting
   * @type {PromiseBatchingQueue}
   */
  it('Active Queue overflows into waiting', () => {
    const queue1 = new PromiseBatchingQueue(4);
    queueAndCheck(queue1, 1, 0);
    queueAndCheck(queue1, 2, 0);
    queueAndCheck(queue1, 3, 0);
    queueAndCheck(queue1, 4, 0);
    queueAndCheck(queue1, 4, 1);
    queueAndCheck(queue1, 4, 2);
  });

  /**
   * The queue overflows but eventually clears the overflow and resolves all callers
   * @type {PromiseBatchingQueue}
   */
  it('Active Queue overflows eventually clears out', () => {
    const queue2 = new PromiseBatchingQueue(4);
    queueAndCheck(queue2, 1, 0);
    queueAndCheck(queue2, 2, 0);
    queueAndCheck(queue2, 3, 0);
    queueAndCheck(queue2, 4, 0);
    return (
      expect(queue2.queue(() => delayedPromiseGenerator(100))).eventually.be.fulfilled &&
      expect(queue2.queue(() => delayedPromiseGenerator(100))).eventually.be.fulfilled &&
      expect(queue2.queue(() => delayedPromiseGenerator(100, 'hello'))).eventually.equal('hello') &&
      expect(queue2.queue(() => delayedPromiseGenerator(100, 'world'))).eventually.equal('world')
    );
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
