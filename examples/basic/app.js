/* eslint-disable */
import Sticky from '../../src/sticky.js'

Vue.directive('Sticky', Sticky)

new Vue({
  el: document.querySelector('.app'),
  template: '#app-template',
  data: {
    offset: {top: 10, bottom: 30},
    stickyEnabled: true,
  }
})
