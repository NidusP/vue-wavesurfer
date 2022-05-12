import Vue from 'vue'
import App from './App.vue'
import VWavesurfer from './components/VueWavesurfer'
import 'view-design/dist/styles/iview.css'

Vue.config.productionTip = false

new Vue({
	render: (h) => h(App)
}).$mount('#app')

const VueWavesurfer = {
	install(Vue) {
		Vue.component(VWavesurfer.name, VueWavesurfer)

		// Object containing Tour objects (see VTour.vue) where the tour name is used as key
		Vue.prototype.$tours = {}
	}
}

export default VueWavesurfer

if (typeof window !== 'undefined' && window.Vue) {
	window.Vue.use(VueWavesurfer)
}
