/* eslint-disable */
import Sticky from '../../src/sticky.js';

Vue.directive('Sticky', Sticky);

new Vue({
  el: document.querySelector('.app'),
  template: '#app-template',
  data: {
    stickyEnabled: true,
  },
  methods: {
    onStick(data) {
      console.log(data);
    },
  },
});
