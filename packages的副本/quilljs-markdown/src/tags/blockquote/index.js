import AbstractTag from '../AbstractTag'
import meta from './meta'
import Quill from 'quill'

class Blockquote extends AbstractTag {
  constructor (quillJS, options = {}) {
    super()
    this.quillJS = quillJS
    this.name = 'blockquote'
    this.pattern = this._getCustomPatternOrDefault(options, this.name, /^(>)\s/g)
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
          this.quillJS.formatLine(selection.index, 1, 'blockquote', true, Quill.sources.USER)
          this.quillJS.deleteText(
            selection.index - originalText.length,
            originalText.length,
            Quill.sources.USER
          )
          resolve(true)
        }, 0)
      }),
      release: () => {
        setTimeout(() => {
          const contentIndex = this.quillJS.getSelection().index

          const [, length] = this.quillJS.getLine(contentIndex)
          if (length === 0) this.quillJS.format('blockquote', false, Quill.sources.USER)
        }, 0)
      }
    }
  }
}

export default Blockquote
