import AbstractTag from '../AbstractTag'
import meta from './meta'
import Quill from 'quill'

class Codeblock extends AbstractTag {
  constructor (quillJS, options = {}) {
    super()
    this.quillJS = quillJS
    this.name = 'pre'
    this.pattern = this._getCustomPatternOrDefault(options, this.name, /^(```).*/g)
    this.getAction.bind(this)
    this._meta = meta()
    this.activeTags = this._getActiveTagsWithoutIgnore(this._meta.applyHtmlTags, options.ignoreTags)
  }

  getAction () {
    return {
      name: this.name,
      pattern: this.pattern,
      action: (text, selection, pattern) => new Promise((resolve) => {
        const match = pattern.exec(text)
        if (!match || !this.activeTags.length) {
          resolve(false)
          return
        }

        const originalText = match[0] || ''
        setTimeout(() => {
          const startIndex = selection.index - originalText.length
          this.quillJS.deleteText(startIndex, originalText.length, Quill.sources.USER)
          setTimeout(() => {
           // this.quillJS.insertText(startIndex, '\n', Quill.sources.USER)
           // const newLinePosition = startIndex + 1 + '\n'.length + 1
           // this.quillJS.insertText(newLinePosition - 1, '\n', Quill.sources.USER)
            this.quillJS.formatLine(startIndex, 0, 'code-block', true, Quill.sources.USER)
            resolve(true)
          }, 0)
        }, 0)
      }),
      release: () => {
        setTimeout(() => {
          const cursorIndex = this.quillJS.getSelection().index
          const block = this.quillJS.getLine(cursorIndex)[0]
          const blockText = block.domNode.textContent
          if (block && blockText && blockText.replace('\n', '').length <= 0) {
            this.quillJS.format('code-block', false, Quill.sources.USER)
          }
        }, 0)
      }
    }
  }
}

export default Codeblock
