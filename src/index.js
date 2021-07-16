import Sticky from './sticky'

const install = function (app) {
  app.directive('Sticky', Sticky)
}

Sticky.install = install

export default Sticky
