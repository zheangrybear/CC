export function css(domNode, rules) {
  if (typeof rules === 'object') {
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const prop in rules) {
      // eslint-disable-next-line no-param-reassign
      domNode.style[prop] = rules[prop];
    }
  }
}

/**
 * getRelativeRect
 * @param  {Object} targetRect  rect data for target element
 * @param  {Element} container  container element
 * @return {Object}             an object with rect data
 */
export function getRelativeRect(targetRect, container) {
  const containerRect = container.getBoundingClientRect();

  return {
    x: targetRect.x - containerRect.x - container.scrollLeft,
    y: targetRect.y - containerRect.y - container.scrollTop,
    x1: targetRect.x - containerRect.x - container.scrollLeft + targetRect.width,
    y1: targetRect.y - containerRect.y - container.scrollTop + targetRect.height,
    width: targetRect.width,
    height: targetRect.height,
  };
}

/**
 * _omit
 * @param  {Object} obj         target Object
 * @param  {Array} uselessKeys  keys of removed properties
 * @return {Object}             new Object without useless properties
 */
// eslint-disable-next-line no-underscore-dangle
export function _omit(obj, uselessKeys) {
  return (
    obj &&
    Object.keys(obj).reduce((acc, key) => {
      return uselessKeys.includes(key) ? acc : { ...acc, [key]: obj[key] };
    }, {})
  );
}

/**
 * getEventComposedPath
 *  compatibility fixed for Event.path/Event.composedPath
 *  Event.path is only for chrome/opera
 *  Event.composedPath is for Safari, FF
 *  Neither for Micro Edge
 * @param {Event} evt
 * @return {Array} an array of event.path
 */
export function getEventComposedPath(evt) {
  let path;
  // chrome, opera, safari, firefox
  path = evt.path || (evt.composedPath && evt.composedPath());

  // other: edge
  // eslint-disable-next-line eqeqeq
  if (path == undefined && evt.target) {
    path = [];
    let { target } = evt;
    path.push(target);

    while (target && target.parentNode) {
      target = target.parentNode;
      path.push(target);
    }
  }

  return path;
}

export function convertToHex(rgb) {
  const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
  // if rgb
  if (/^(rgb|RGB)/.test(rgb)) {
    const color = rgb.toString().match(/\d+/g);
    let hex = '#';
    let i = 0;
    for (; i < 3; i += 1) {
      hex += `0${Number(color[i]).toString(16)}`.slice(-2);
    }
    return hex;
  }
  if (reg.test(rgb)) {
    const aNum = rgb.replace(/#/, '').split('');
    if (aNum.length === 6) {
      return rgb;
    }
    if (aNum.length === 3) {
      let numHex = '#';
      for (let i = 0; i < aNum.length; i += 1) {
        numHex += aNum[i] + aNum[i];
      }
      return numHex;
    }
  }

  return rgb;
}
