// @ts-nocheck
import { BlockType, Controller, KeyType, Model } from '@blink-mind/core';
import debug from 'debug';
import * as React from 'react';
import dynamic from 'next/dynamic';
import ResizeObserver from 'resize-observer-polyfill';
import styled from 'styled-components';
import ReactQuill from 'react-quill';

const ContentEditor = dynamic(() => import('./content-editor'), {
  ssr: false,
});
const log = debug('node:text-editor');

interface ContentProps {
  readOnly?: boolean;
}

const Content = styled.div<ContentProps>`
  background-color: ${(props) => (props.readOnly ? null : 'white')};
  cursor: ${(props) => (props.readOnly ? 'pointer' : 'text')};
  min-width: 50px;
`;

interface Props {
  controller: Controller;
  model: Model;
  readOnly: boolean;
  topicKey: KeyType;
  saveRef?: Function;
  getRef?: Function;
}

interface State {
  content: any;
}

export class SimpleTextEditor extends React.PureComponent<Props, State> {
  state = {
    content: null,
  };

  onMouseDown = (e) => {
    e.stopPropagation();
  };

  onMouseMove = (e) => {
    // log('onMouseMove');
    // e.stopPropagation();
  };
  onChange(e) {
    log('onChange', e);
    this.setState({ content: e });
  }

  onKeyDown = (e) => { };

  componentDidMount() {
    // const { readOnly } = this.props;
    // if (readOnly) return;
    document.addEventListener('click', this._handleClick);
    const contentResizeObserver = new ResizeObserver(
      (entries: ResizeObserverEntry[], observer) => {
        this.props.controller.run('layout', this.props);
      }
    );
    contentResizeObserver.observe(
      this.props.getRef(
        this.getCustomizeProps().getRefKeyFunc(this.props.topicKey)
      )
    );
  }

  componentWillUnmount() {
    // const { readOnly } = this.props;
    // if (readOnly) return;
    document.removeEventListener('click', this._handleClick);
  }

  _handleClick = (event) => {
    const wasOutside = !this.root.contains(event.target);
    wasOutside && this.onClickOutSide(event);
  };

  onClickOutSide(e) { }

  getCustomizeProps() {
    return null;
  }

  getContent() {
    const { block } = this.getCustomizeProps();
    return block.data;
  }

  root;
  editor = React.createRef<ReactQuill>();

  rootRef = (saveRef) => (ref) => {
    saveRef(ref);
    this.root = ref;
  };

  render() {
    const { topicKey, saveRef, getRef } = this.props;
    const { readOnly, getRefKeyFunc, placeholder, style } =
      this.getCustomizeProps();
    log(readOnly);
    const key = getRefKeyFunc(topicKey);
    const content = this.state.content || this.getContent();
    const { onMouseDown, onMouseMove, onKeyDown } = this;
    const editorProps = {
      html: content,
      readOnly,
      onChange: this.onChange.bind(this),
      placeholder,
      style,
      controller: this.props.controller,
      model: this.props.model,
      topicKey: this.props.topicKey,
      editable: this.props.editable
    };
    const contentProps = {
      key,
      readOnly,
      ref: this.rootRef(saveRef(key)),
      onMouseDown,
      onMouseMove,
      onKeyDown,
    };
    return (
      <Content {...contentProps} className="simple-editor">
        <ContentEditor {...editorProps} autoFocus={!readOnly} editorRef={this.editor} />
      </Content>
    );
  }
}
