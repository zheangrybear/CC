import meta from './meta'
import AbstractTag from '../AbstractTag'
import Quill from 'quill'

class Hr extends AbstractTag {
  constructor (quillJS, options = {}) {
    super()
    this.quillJS = quillJS
    this.name = 'hr'
    this.pattern = this._getCustomPatternOrDefault(options, this.name, /^([-*]\s?){3}/g)
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
        const [line] = this.quillJS.getLine(selection.index)
        const index = this.quillJS.getIndex(line)

        setTimeout(() => {
          this.quillJS.deleteText(index, text.length, Quill.sources.USER)
          this.quillJS.insertEmbed(index, 'hr', true, Quill.sources.USER)
          this.quillJS.insertText(index + 1, "\n", Quill.sources.USER)
          this.quillJS.setSelection(index + 1, Quill.sources.USER)
          resolve(true)
        }, 0)
      })
    }
  }
}

export default Hr
