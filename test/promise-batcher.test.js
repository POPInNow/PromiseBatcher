import chai from 'chai';
import DefaultPromiseBatcher, { PromiseBatcher } from '../src/promise-batcher';

const expect = chai.expect;

describe('Basic Sanity Test', () => {
  it('PromiseBatcher is exported as a constant name', () => {
    expect(PromiseBatcher).to.be.a('function');
  });
  it('PromiseBatcher does not allow instantiation', () => {
    expect(PromiseBatcher).to.throw();
  });
  it('PromiseBatcher is a Singleton', () => {
    expect(DefaultPromiseBatcher).to.deep.equal(PromiseBatcher);
  });
});

