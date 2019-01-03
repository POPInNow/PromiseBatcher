# PromiseBatcher

A simple promise batching library.

## What

PromiseBatcher is a simple batching Promise library. It runs promises in ordered  
queues which are limited to a user declared maximum size.

## Why

For education and fun. Also, while the non-standard `Promise.all()` extension  
exists in many Promise libraries - there are certain situations where the  
behavior is not ideal. `all()` requires that all the batched Promises are known  
at the single callsite, and run the Promises in parallel - only delivering a  
chained result once all the Promises are complete.

In contrast, PromiseBatcher can take arbitrarily many Promises, and will eagerly  
run as many of them in parallel as it is allowed to. Once a maximum size is  
reached for parallel in flight requests, PromiseBatcher will simply have consumers  
of the later Promises wait for their turn in the active queue.

Because of its batching max-size behavior - this also allows PromiseBatcher to  
enforce a FIFO serialized execution order - where an arbitrary number of Promises  
is executed one at a time in the order they are initialized.

# Install

```
$ yarn add promise-batching-queue

OR

$ npm install promise-batching-queue
```

## How

The API is very simple.

First you import the `PromiseBatcher`:

In the ES6 browser environment:
```
import { PromiseBatcher } from 'promise-batching-queue';

or (if you like default imports more)

import PromiseBatcher from 'promise-batching-queue';
```

In the Node environment
```
const { PromiseBatcher } = require('promise-batching-queue');
```

Then you create a new batching queue using one of the static helper methods
```
const eagerQueue = PromiseBatcher.newEagerQueue();
const serialQueue = PromiseBatcher.newSerialQueue();
```

Then you queue up promises via callback functions
```
eagerQueue.queue(() => {
  // ... do stuff ...
  return Promise.resolve(/* stuff */);
});

serialQueue.queue(() => {
  // ... do stuff ...
  return Promise.resolve(/* stuff */);
});
```

That's it! You can chain off of the result of `queue()` as you would any normal  
Promise, because the return value of `queue()` is a normal Promise!

The `queue()` function takes a function as it's parameter instead of a plain  
`Promise` because there is no way to know when a Promise will run or complete,  
so we avoid this issue by making sure we do not actually create the Promise  
until the parameter function is run at a later - expected - point.

You do not have to chain off of the internal `Promise`, as the result of your  
passed in `Promise` will always be returned to you in the original `Promise`  
chain, even if the internal `Promise` does not actually run until after a  
waiting period.

The library is different from similar tools such as the `promise-queue` in that  
if you exceed the max limit of parallel running `Promises` in a queue, instead  
of rejecting your `Promise` it will simply wait until there is space available  
to run.

### Known Issues

This is not a bulletproof library, just a simple education excercise turned tool.  
I do not know how/if it works in the browser. I do not know how/if it works on  
the backend. Help me find out.

## Credits

This library is primarily built and maintained by [Peter Yamanaka](https://github.com/pyamsoft)
at [POPin](https://github.com/POPinNow).  
The PromiseBatcher library is used internally in the
[POPin Web Application](https://app.popinnow.com)
