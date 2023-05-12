// @ts-nocheck
import { BlockType, FocusMode, OpType } from '@blink-mind/core';
import debug from 'debug';

import { SimpleTextEditor } from './simple-text-editor';

const log = debug('node:topic-content-editor');

function contentEditorRefKey(key) {
  return `content-editor-${key}`;
}

export class TopicContentEditor extends SimpleTextEditor {
  constructor(props) {
    super(props);
  }
  getCustomizeProps() {
    const { model, topicKey, readOnly } = this.props;
    const { block } = model.getTopic(topicKey).getBlock(BlockType.CONTENT);
    const getRefKeyFunc = contentEditorRefKey;
    const style = {
      whiteSpace: 'pre',
    };
    return {
      block,
      readOnly,
      getRefKeyFunc,
      placeholder: 'new',
      style,
    };
  }

  onKeyDown = (e) => {
    if (e.nativeEvent.code === 'Enter') {
      if (e.metaKey || e.ctrlKey) {
        const quill = this.editor.current?.getEditor();
        if (!quill) {
          return;
        }
        const range = quill.getSelection();
        if (range) {
          quill.insertText(range.index, '\n');
        }
      } else {
        e.preventDefault();
        e.stopPropagation();
        this.save();
      }
    }
  };

  onClickOutSide(e) {
    const { model, topicKey, controller, readOnly } = this.props;
    if (this.state.content != null) {
      this.save();
    } else if (!readOnly) {
      controller.run('operation', {
        ...this.props,
        opType: OpType.FOCUS_TOPIC,
        topicKey: topicKey,
      });
    } else if (!e.defaultPrevented && readOnly) {
      if (model.focusKey === topicKey) {
        controller.run('operation', {
          ...this.props,
          opType: OpType.FOCUS_TOPIC,
          topicKey: null,
        });
      }
    }
  }

  save() {
    const { controller } = this.props;
    controller.run('operation', {
      ...this.props,
      opType: OpType.SET_TOPIC_BLOCK,
      blockType: BlockType.CONTENT,
      data: this.state.content,
      focusMode: FocusMode.NORMAL,
    });
    this.setState({ content: null })
  }
}
