const namespace = '@@vue-sticky-directive'
const events = [
  'resize',
  'scroll',
  'touchstart',
  'touchmove',
  'touchend',
  'pageshow',
  'load'
]

const batchStyle = (el, style = {}, className = {}) => {
  for (let k in style) {
    el.style[k] = style[k]
  }
  for (let k in className) {
    if (className[k] && !el.classList.contains(k)) {
      el.classList.add(k)
    } else if (!className[k] && el.classList.contains(k)) {
      el.classList.remove(k)
    }
  }
}

class Sticky {
  constructor (el, vm) {
    this.el = el
    this.vm = vm
    this.unsubscribers = []
    this.isPending = false
    this.state = {
      isTopSticky: null,
      height: null,
      width: null,
      xOffset: null
    }

    const offset = this.getAttribute('sticky-offset') || {}
    const side = this.getAttribute('sticky-side') || 'top'

    this.options = {
      topOffset: Number(offset.top) || 0,
      bottomOffset: Number(offset.bottom) || 0,
      shouldTopSticky: side === 'top' || side === 'both',
      shouldBottomSticky: side === 'bottom' || side === 'both'
    }
  }

  doBind () {
    if (this.unsubscribers.length > 0) {
      return
    }
    const {el, vm} = this
    vm.$nextTick(() => {
      this.placeholderEl = document.createElement('div')
      this.containerEl = this.getContainerEl()
      el.parentNode.insertBefore(this.placeholderEl, el)
      events.forEach((event) => {
        const fn = this.update.bind(this)
        this.unsubscribers.push(() => window.removeEventListener(event, fn))
        this.unsubscribers.push(() => this.containerEl.removeEventListener(event, fn))
        window.addEventListener(event, fn, {passive: true})
        this.containerEl.addEventListener(event, fn, {passive: true})
      })
    })
  }

  doUnbind () {
    this.unsubscribers.forEach(fn => fn())
    this.unsubscribers = []
    this.resetElement()
  }

  update () {
    if (!this.isPending) {
      requestAnimationFrame(() => {
        this.isPending = false
        this.recomputeState()
        this.updateElements()
      })
      this.isPending = true
    }
  }

  isTopSticky () {
    if (!this.options.shouldTopSticky) return false
    const fromTop = this.state.placeholderElRect.top
    const fromBottom = this.state.containerElRect.bottom

    const topBreakpoint = this.options.topOffset
    const bottomBreakpoint = this.options.bottomOffset

    return fromTop <= topBreakpoint && fromBottom >= bottomBreakpoint
  }

  isBottomSticky () {
    if (!this.options.shouldBottomSticky) return false
    const fromBottom = window.innerHeight - this.state.placeholderElRect.top - this.state.height
    const fromTop = window.innerHeight - this.state.containerElRect.top

    const topBreakpoint = this.options.topOffset
    const bottomBreakpoint = this.options.bottomOffset

    return fromBottom <= bottomBreakpoint && fromTop >= topBreakpoint
  }

  recomputeState () {
    this.state = Object.assign({}, this.state, {
      height: this.getHeight(),
      width: this.getWidth(),
      xOffset: this.getXOffset(),
      placeholderElRect: this.getPlaceholderElRect(),
      containerElRect: this.getContainerElRect()
    })
    this.state.isTopSticky = this.isTopSticky()
    this.state.isBottomSticky = this.isBottomSticky()
  }

  updateElements () {
    const placeholderStyle = {paddingTop: 0}
    const elStyle = {
      position: 'static',
      top: 'auto',
      bottom: 'auto',
      left: 'auto',
      width: 'auto',
      zIndex: '10'
    }
    const placeholderClassName = {'vue-sticky-placeholder': true}
    const elClassName = {
      'vue-sticky-el': true,
      'top-sticky': false,
      'bottom-sticky': false
    }

    if (this.state.isTopSticky) {
      elStyle.position = 'fixed'
      elStyle.top = this.options.topOffset + 'px'
      elStyle.left = this.state.xOffset + 'px'
      elStyle.width = this.state.width + 'px'
      const bottomLimit = this.state.containerElRect.bottom - this.state.height - this.options.bottomOffset - this.options.topOffset
      if (bottomLimit < 0) {
        elStyle.top = bottomLimit + this.options.topOffset + 'px'
      }
      placeholderStyle.paddingTop = this.state.height + 'px'
      elClassName['top-sticky'] = true
    } else if (this.state.isBottomSticky) {
      elStyle.position = 'fixed'
      elStyle.bottom = this.options.bottomOffset + 'px'
      elStyle.left = this.state.xOffset + 'px'
      elStyle.width = this.state.width + 'px'
      const topLimit = this.state.containerElRect = (window.innerHeight - this.state.containerElRect.top) - this.state.height - this.options.bottomOffset - this.options.topOffset
      if (topLimit < 0) {
        elStyle.bottom = topLimit + this.options.bottomOffset + 'px'
      }
      placeholderStyle.paddingTop = this.state.height + 'px'
      elClassName['bottom-sticky'] = true
    } else {
      placeholderStyle.paddingTop = 0
    }

    batchStyle(this.el, elStyle, elClassName)
    batchStyle(this.placeholderEl, placeholderStyle, placeholderClassName)
  }

  resetElement () {
    ['position', 'top', 'bottom', 'left', 'width', 'zIndex'].forEach((attr) => {
      this.el.style.removeProperty(attr)
    })
    this.placeholderEl.parentNode.removeChild(this.placeholderEl)
  }

  getContainerEl () {
    let node = this.el.parentNode
    while (node && node.tagName !== 'HTML' && node.tagName !== 'BODY' && node.nodeType === 1) {
      if (node.hasAttribute('sticky-container')) {
        return node
      }
      node = node.parentNode
    }
    return this.el.parentNode
  }

  getXOffset () {
    return this.placeholderEl.getBoundingClientRect().left
  }

  getWidth () {
    return this.placeholderEl.getBoundingClientRect().width
  }

  getHeight () {
    return this.el.getBoundingClientRect().height
  }

  getPlaceholderElRect () {
    return this.placeholderEl.getBoundingClientRect()
  }

  getContainerElRect () {
    return this.containerEl.getBoundingClientRect()
  }

  getAttribute (name) {
    const expr = this.el.getAttribute(name)
    if (expr) {
      return this.vm[expr] || expr
    } else {
      return undefined
    }
  }
}

export default {
  inserted (el, bind, vnode) {
    if (typeof bind.value === 'undefined' || bind.value) {
      el[namespace] = new Sticky(el, vnode.context)
      el[namespace].doBind()
    }
  },
  unbind (el, bind, vnode) {
    if (el[namespace]) {
      el[namespace].doUnbind()
      el[namespace] = undefined
    }
  },
  componentUpdated (el, bind, vnode) {
    if (typeof bind.value === 'undefined' || bind.value) {
      if (!el[namespace]) {
        el[namespace] = new Sticky(el, vnode.context)
      }
      el[namespace].doBind()
    } else {
      if (el[namespace]) {
        el[namespace].doUnbind()        
      }
    }
  }
}
