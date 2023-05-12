import * as React from 'react';
import ReactQuill, { Quill } from 'react-quill';
import imageResize from 'quill-image-resize-module-react';
import Uploader from '@/components/Document/uploader';
import MarkdownShortcuts from '@/components/Document/markdown/index'
import 'react-quill/dist/quill.bubble.css';
import { Controller, Model } from '@/packages/blink-mind-core';
Quill.register('modules/imageResize', imageResize);
Quill.register('modules/markdownShortcuts', MarkdownShortcuts);
Quill.register('modules/uploader', Uploader);
const Parchment = Quill.import('parchment');
const ImageBlot = Quill.import('formats/image');

interface Props {
  html: string;
  autoFocus?: boolean;
  placeholder?: string;
  readOnly?: boolean;
  onChange: (value: any) => void;
  controller: Controller;
  editorRef: React.MutableRefObject<ReactQuill | null>;
  model: Model
  topicKey: string;
  editable?: boolean;
}

function normalizeHtml(str: string): string {
  return (
    str &&
    str
      .replace(/<\/?(p|br|span)[^<]*>/g, '')
      .replace(/\s/g, '')
      .replace(/\n/g, '')
      .replace(/&\/?(amp;)/g, '')
      .replace(/&/g, '')
      .replace(/style=\"(.*)\"/gi, '')
  );
}
export default class ContentEditor extends React.Component<Props> {
  constructor(props) {
    super(props);
  }
  el = React.createRef<ReactQuill>();

  modules = {
    toolbar: {
      container: [
        [{ header: ['1', '2', '3', '4', '5', '6', false] }, { font: [] }],
        [{ size: [] }],
        [
          'bold',
          'italic',
          'underline',
          'strike',
          'blockquote',
          {
            color: [
              '#000000',
              '#e60000',
              '#ff9900',
              '#ffff00',
              '#008a00',
              '#0066cc',
              '#9933ff',
              '#ffffff',
              '#facccc',
              '#ffebcc',
              '#ffffcc',
              '#cce8cc',
              '#cce0f5',
              '#ebd6ff',
              '#bbbbbb',
              '#f06666',
              '#ffc266',
              '#ffff66',
              '#66b966',
              '#66a3e0',
              '#c285ff',
              '#888888',
              '#a10000',
              '#b26b00',
              '#b2b200',
              '#006100',
              '#0047b2',
              '#6b24b2',
              '#444444',
              '#5c0000',
              '#663d00',
              '#666600',
              '#003700',
              '#002966',
              '#3d1466',
              'custom-color',
            ],
          },
        ],
        [
          { list: 'ordered' },
          { list: 'bullet' },
          { indent: '-1' },
          { indent: '+1' },
        ],
        ['link', 'clean'],
      ],
    },

    clipboard: {
      matchVisual: false,
    },
    imageResize: {
      parchment: Parchment,
      modules: ['Resize', 'DisplaySize'],
    },
    markdownShortcuts: {
      onFinish: () => { },
    },
    uploader: {
      upload: (file: File) => {
        return new Promise((resolve, reject) => {
          this.props.controller.run('onQiniuUpload', { file, resolve, reject });
        });
      },
    },
  };
  formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'code-block',
    'underline',
    'strike',
    'code',
    'hr',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'video',
    'width',
    'color',
  ];

  render() {
    const { html } = this.props;
    return (
      <ReactQuill
        theme="bubble"
        placeholder=""
        ref={this.el}
        readOnly={this.props.readOnly || !this.props.editable}
        onChange={this.props.onChange}
        value={html || ' '}
        modules={this.modules}
        formats={this.formats}
      />
    );
  }
  shouldComponentUpdate(nextProps: Props): boolean {
    const ele = this.el.current?.getEditor().root;
    if (!ele) return true;
    if (normalizeHtml(nextProps.html) !== normalizeHtml(ele.innerHTML)) {
      return true;
    }
    if (nextProps.readOnly !== this.props.readOnly) {
      return true;
    }

    return false;
  }

  componentDidMount() {
    this.props.editorRef.current = this.el.current;
    this.el.current?.getEditor().root.addEventListener('click', (e) => {
      const img = Parchment.find(e.target);
      if (img instanceof ImageBlot && this.props.readOnly) {
        e.preventDefault()
        e.stopPropagation()
        this.props.controller.run('createEditor', {
          node_id: this.props.topicKey,
        });
        this.props.controller.run('handleTopicClick', { ...this.props });
        this.props.controller.run('handleTopicDoubleClick', this.props);
        const imageSrc = (e.target as HTMLImageElement)?.src
        setTimeout(() => {
          let targetElement
          for (const ele of document.querySelectorAll('.ql-editor img') || []) {
            if ((ele as HTMLImageElement).src === imageSrc) {
              targetElement = ele
              break
            }
          }
          targetElement?.click()
        })
      }

    })
    const keyboard = this.el.current?.getEditor()?.getModule('keyboard');
    if (keyboard) delete keyboard.bindings[13];
    if (this.props.autoFocus) {
      const quill = this.el.current?.getEditor();
      quill?.focus();
      const index = quill?.getLength() ?? 0;
      if (index) quill?.setSelection(index, 0);
    }
  }

  componentDidUpdate(prev) {
    if (prev.readOnly && !this.props.readOnly) {
      this.props.editorRef.current = this.el.current;
      if (!this.el) return;
      const quill = this.el.current?.getEditor();
      const index = quill?.getLength() ?? 0;
      if (index) quill?.setSelection(index, index);
    }
  }
}
