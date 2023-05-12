import AbstractTag from '../AbstractTag'
import meta from './meta'
import Quill from 'quill'

class Checkbox extends AbstractTag {
  constructor (quillJS, options = {}) {
    super()
    this.quillJS = quillJS
    this.name = 'checkbox-checked'
    this.pattern = this._getCustomPatternOrDefault(options, 'checkbox', /^(\[x\])+\s/g)
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
          const replaceText = text.split('[x] ').splice(1, 1).join('')
          this.quillJS.insertText(index, replaceText, Quill.sources.USER)
          this.quillJS.deleteText(index + replaceText.length - 1, text.length, Quill.sources.USER)
          setTimeout(() => {
            this.quillJS.formatLine(index, 0, 'list', 'checked', Quill.sources.USER)
            resolve(true)
          })
        }, 0)
      })
    }
  }
}

export default Checkbox
