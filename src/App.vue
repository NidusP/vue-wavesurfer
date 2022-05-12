<template>
	<div id="app">
		<VueWavesurfer ref="wavesurferRef" default-theme="light" :show-tape="tapeShow"></VueWavesurfer>
		<!-- <vue-wavesurfer
			ref="wavesurferRef2"
			default-theme="light"
			:wavesurferOptions="{ backend: 'MediaElement' }"
		></vue-wavesurfer> -->
		<button @click="playPause">audio /</button>
		<time>{{ currentTime }}</time>
		<button @click="tapeShow = !tapeShow">tapeShow--- {{ tapeShow }}</button>
	</div>
</template>

<script>
import * as Tone from 'tone'
import VueWavesurfer from './components/VueWavesurfer'
import ALALAMO from '@/assets/ALALAMO.mp3'
import liXiangSanXun from '@/assets/liXiangSanXun.mp3'
import a03403 from '@/assets/03403.wav'

export default {
	name: 'App',
	components: {
		VueWavesurfer
	},
	data() {
		return {
			tapeShow: true,
			currentTime: ''
		}
	},
	methods: {
		playPause() {
			this.grainCache = new Tone.GrainPlayer({
				url: this.decodedData,
				playbackRate: 2,
				grainSize: 0.2
			})
			this.grainCache.toDestination()
			this.grainCache.start(0)
			return false
			// const audioCtx = this.audioCtx
			// if (audioCtx.isPlaying) {
			// 	this.sourceDisconnectToDestination()
			// 	// this.audioCtx.suspend()
			// 	audioCtx.isPlaying = false
			// } else {
			// 	this.source = this.sourceConnectToDestination()
			// 	this.source.start(0)
			// 	console.log('audioCtx.currentTime', audioCtx.currentTime)
			// 	audioCtx.isPlaying = true
			// 	this.audioprocess()
			// }
			// console.log(this.source, this.audioCtx, '-------------playPause')
		},
		frame(func) {
			return (...args) => requestAnimationFrame(() => func(...args))
		},
		audioprocess() {
			console.log()
			this.currentTime = Math.floor(this.audioCtx.currentTime)
			requestAnimationFrame(this.audioprocess)
		},
		sourceDisconnectToDestination() {
			this.source.stop()
			this.source.disconnect()
		},
		sourceConnectToDestination() {
			const decodedData = this.decodedData,
				audioCtx = this.audioCtx
			console.log('this.grainCache', this.grainCache.buffer._buffer, decodedData)
			const source = audioCtx.createBufferSource()
			// source.buffer = decodedData
			source.buffer = this.grainCache.buffer._buffer
			source.connect(audioCtx.destination)
			source.loop = true
			return source
		},
		getAudio(audio) {
			fetch(audio)
				.then((res) => res.arrayBuffer())
				.then((data) => {
					const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
					audioCtx.isPlaying = false
					audioCtx.decodeAudioData(data).then((buffer) => {
						this.decodedData = buffer
						this.audioCtx = audioCtx
					})
				})
		}
	},
	mounted() {
		console.log(liXiangSanXun, 'liXiangSanXun', this)
		this.getAudio(a03403)
		this.$refs.wavesurferRef.PlayList([a03403, ALALAMO])
		// var audioElement = new Audio(a03403);
		// audioElement.play()
	}
}
</script>
