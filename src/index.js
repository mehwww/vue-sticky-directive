import Sticky from './sticky'

const install = function (Vue) {
  Vue.directive('Sticky', Sticky)
}

if (window.Vue) {
  Vue.use(install)
}

Sticky.install = install

export default Sticky
