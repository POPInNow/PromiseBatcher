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

    const id = generateId();

    /**
     * Gets the promise generator function
     * @return {Function}
     */
    this.getPromiseGenerator = () => {
      return promiseGenerator;
    }

    /**
     * Gets the id
     * @return {string}
     */
    this.getId = () => {
      return id;
    }

    /**
     * Call the cached Promise resolve with the result
     */
    this.resolve = (result) => {
      resolveFunction(result);
    }

    /**
     * Call the cached Promise reject with the error
     */
    this.reject = (error) => {
      rejectFunction(error);
    }
  }
}
