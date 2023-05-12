import AbstractTag from '../AbstractTag'
import meta from './meta'
import Quill from 'quill'

class inlineCode extends AbstractTag {
  constructor (quillJS, options = {}) {
    super()
    this.quillJS = quillJS
    this.name = 'code'
    this.pattern = this._getCustomPatternOrDefault(options, this.name, (value) => { return /(`){1}([^`]+)(`){1}/g.test(value) && !(/```.*/.test(value)) ? value : null })
    this.getAction.bind(this)
    this._meta = meta()
    this.activeTags = this._getActiveTagsWithoutIgnore(this._meta.applyHtmlTags, options.ignoreTags)
  }

  getAction () {
    return {
      name: this.name,
      pattern: this.pattern,
      action: (text, selection, pattern, lineStart) => new Promise((resolve) => {
        let match = /(`){1}([^`]+)(`){1}/g.exec(text)
        if (!match || !this.activeTags.length) {
          resolve(false)
          return
        }

        const [annotatedText] = match
        const startIndex = lineStart + match.index
        setTimeout(() => {
          this.quillJS.deleteText(startIndex, annotatedText.length, Quill.sources.USER)
          const message = annotatedText.replace(/`/g, '')
          this.quillJS.insertText(startIndex, message, { code: true }, Quill.sources.USER)
          this.quillJS.setSelection(lineStart + text.length - 3, Quill.sources.USER)
          resolve(true)
        }, 0)
      })
    }
  }
}

export default inlineCode
