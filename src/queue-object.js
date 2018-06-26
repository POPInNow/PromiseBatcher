import { TYPE_FUNCTION } from './constants';

/**
 * Pulled from Stack Overflow...
 * @return {string}
 */
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
};

export class QueueObject {

  constructor (resolveFunction, rejectFunction, promiseGenerator) {
    if (!resolveFunction) {
      throw Error('QueueObject missing resolveFunction');
    }
    if (!rejectFunction) {
      throw Error('QueueObject missing rejectFunction');
    }
    if (!promiseGenerator) {
      throw Error('QueueObject missing promiseGenerator');
    }
    if (typeof(promiseGenerator) !== TYPE_FUNCTION) {
      throw Error('promiseGenerator argument must be a function');
    }
    if (typeof(resolveFunction) !== TYPE_FUNCTION) {
      throw Error('resolveFunction argument must be a function');
    }
    if (typeof(rejectFunction) !== TYPE_FUNCTION) {
      throw Error('rejectFunction argument must be a function');
    }

    this.__resolveFunction = resolveFunction;
    this.__rejectFunction = rejectFunction;
    this.__promiseGenerator = promiseGenerator;
    this.__id = generateId();
  }

  /**
   * Gets the promise generator function
   * @return {Function}
   */
  getPromiseGenerator () {
    return this.__promiseGenerator;
  }

  /**
   * Gets the id
   * @return {string}
   */
  getId () {
    return this.__id;
  }

  /**
   * Call the cached Promise resolve with the result
   */
  resolve (result) {
    this.__resolveFunction(result);
  }

  /**
   * Call the cached Promise reject with the error
   */
  reject (error) {
    this.__rejectFunction(error);
  }
}
