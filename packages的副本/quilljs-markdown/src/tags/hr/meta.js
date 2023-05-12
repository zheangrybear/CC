export default (options) => {
  return {
    applyHtmlTags: ['hr'].map(tag => tag.toLowerCase())
  }
}