// @ts-nocheck
import { List, Record } from 'immutable';

import { BlockType, KeyType } from '../types';
import { Block } from './block';
import { Relation } from './relation';

type TopicRecordType = {
  key: KeyType;
  parentKey?: KeyType;
  collapse?: boolean;
  subKeys?: List<KeyType>;
  blocks?: List<Block>;
  relations?: List<Relation>;
  style?: string;
  color?: string;
};

type CreateTopicArg = {
  key: KeyType;
  parentKey?: KeyType;
  collapse?: boolean;
  content?: any;
  subKeys?: List<KeyType> | KeyType[];
  style?: string;
};

const defaultTopicRecord: TopicRecordType = {
  key: null,
  parentKey: null,
  collapse: false,
  subKeys: null,
  blocks: null,
  relations: null,
  style: null,
  color: null,
};

export class Topic extends Record(defaultTopicRecord) {
  get key() {
    return this.get('key');
  }
  get parentKey() {
    return this.get('parentKey');
  }
  get collapse() {
    return this.get('collapse');
  }
  get subKeys(): List<KeyType> {
    return this.get('subKeys');
  }
  get blocks(): List<Block> {
    return this.get('blocks');
  }
  get relations() {
    return this.get('relations');
  }
  get style() {
    return this.get('style');
  }
  get color() {
    return this.get('color');
  }

  getBlock(type: string): { index: number; block: Block } {
    const index = this.blocks.findIndex((b) => b.type === type);
    if (index === -1) return { index, block: null };
    return { index, block: this.blocks.get(index) };
  }

  static fromJSON(obj) {
    const {
      key,
      parentKey = null,
      blocks,
      subKeys = [],
      collapse = false,
      style = null,
      color = null,
    } = obj;
    return new Topic({
      key,
      parentKey,
      collapse,
      style,
      color,
      subKeys: List(subKeys),
      blocks: Block.createList(blocks),
    });
  }

  static create({
    key,
    parentKey = null,
    content = '',
    subKeys = [],
    collapse = false,
  }: CreateTopicArg): Topic {
    const block = Block.create({
      type: BlockType.CONTENT,
      data: content,
      key: null,
    });
    const blocks = List([block]);
    return new Topic({
      key,
      parentKey,
      blocks,
      subKeys: List(subKeys),
      collapse,
    });
  }
}
