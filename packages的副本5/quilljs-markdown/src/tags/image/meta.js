export default (options) => {
  return {
    applyHtmlTags: ['image'].map(tag => tag.toLowerCase())
  }
}