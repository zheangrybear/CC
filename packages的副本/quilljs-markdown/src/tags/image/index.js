import meta from './meta'
import AbstractTag from '../AbstractTag'
import Quill from 'quill'

class Image extends AbstractTag {
  constructor (quillJS, options = {}) {
    super()
    this.quillJS = quillJS
    this.name = 'image'
    this.pattern = this._getCustomPatternOrDefault(options, this.name, /(?:!\[(.+?)\])(?:\((.+?)\))/g)
    this.getAction.bind(this)
    this._meta = meta()
    this.activeTags = this._getActiveTagsWithoutIgnore(this._meta.applyHtmlTags, options.ignoreTags)
  }

  getAction () {
    return {
      name: this.name,
      pattern: this.pattern,
      action: (text, selection, pattern, lineStart) => new Promise((resolve) => {
        const startIndex = text.search(pattern)
        const matchedText = text.match(pattern)[0]
        const hrefLink = text.match(/(?:\((.*?)\))/g)[0]
        const start = selection.index - 1 + startIndex

        if (!this.activeTags.length) {
          resolve(false)
          return
        }

        if (startIndex !== -1) {
          setTimeout(() => {
            const inlineModeText = this.quillJS.getText(start - matchedText.length, matchedText.length)
            const beginOffset = inlineModeText === matchedText ? start - matchedText.length : start
            this.quillJS.deleteText(beginOffset, matchedText.length, Quill.sources.USER)
            this.quillJS.insertEmbed(beginOffset, 'image', hrefLink.slice(1, hrefLink.length - 1), Quill.sources.USER)
            this.quillJS.setSelection(beginOffset + text.length - matchedText.length, Quill.sources.USER)
            resolve(true)
          }, 0)
        } else {
          resolve(false)
        }
      })
    }
  }
}

export default Image
