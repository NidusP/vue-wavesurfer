<template>
	<div
		class="wavesurfer-wrap"
		:class="defaultTheme"
		@keydown="deleteRegion"
		tabindex="0"
		:style="{ backgroundColor: wrapBackgroundColor }"
	>
		<div
			class="progress"
			:style="{
				width: `${percents > 0 ? percents : 0}%`,
				visibility: percents < 0 ? 'hidden' : 'visible'
			}"
		></div>
		<div class="wave-form-tape" ref="waveFormTape"></div>
		<div class="wave-form" ref="waveForm" :style="{ height: waveformHeight }"></div>
		<div class="wave-spectrogram" ref="waveSpectrogram" :style="{ height: waveformHeight }"></div>
		<div class="wave-time" ref="waveTime"></div>
		<div class="wave-tools" v-if="!$slots.tools">
			<i class="icon-control icon-prev" @click="listControl('backward')">上一条</i>
			<i class="icon-control icon-backward" @click="skipControl('backward')">快退</i>
			<i class="icon-control" :class="playClass" @click="playControl">播放</i>
			<i class="icon-control icon-forward" @click="skipControl('forward')">快进</i>
			<i class="icon-control icon-next" @click="listControl('backward')">下一条</i>
			<transition name="fade">
				<span class="wave-time" v-if="percents < 0">
					<time class="time-process">{{ time }}</time>
					<span class="time-split">/</span>
					<time class="time-duration">{{ duration }}</time>
				</span>
				<transition name="rotate-infinite" v-else>
					<i class="icon-loader icon-control"></i>
				</transition>
			</transition>
			<i class="icon-control icon-change" @click="channelControl">{{ channelCh }}</i>
			<Poptip trigger="click" title="Title" content="content">
				<i :class="volumeClass" @click="volumeControl">音量</i>
			</Poptip>
			<i class="icon-control icon-loop" @click="loopControl">循环</i>
			<i class="icon-control icon-download" @click="downloadControl">下载</i>
			<i class="icon-control icon-switch-up-down" @click="waveControl">切换语谱图</i>
			<!--<i class="icon-control icon-airplay" @click="themeControl"></i>-->
		</div>
		<slot v-else name="tools"></slot>
	</div>
</template>

<script>
import * as Tone from 'tone'
import WaveSurfer from 'wavesurfer.js'
import Regions from 'wavesurfer.js/dist/plugin/wavesurfer.regions.js'
import Timeline from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.js'
import Spectrogram from 'wavesurfer.js/dist/plugin/wavesurfer.spectrogram.js'
import { bufferToWave, copyAudioBuffer, downloadBlob, seconds2Minutes, throttle } from '../utils/utils.js'
import waveTheme from '../config/theme.js'
import { channelFlags } from '../utils/channelFlags.js'
import '../assets/styles/global.scss'
import { Poptip } from 'view-design'

export default {
	name: 'VueWavesurfer',
	components: {Poptip},
	data() {
		return {
			time: '00:00',
			duration: '00:00',
			percents: -1,
			volume: 0,
			mute: false,
			channel: channelFlags.both,
			isPlaying: false,
			waveformHeight: '',
			wrapBackgroundColor: '#fff'
		}
	},
	watch: {
		showTape(next) {
			if (next) {
				this.initWaveSurferTape()
			} else {
				this.myWaveTape.destroy()
			}
			this.loadAudio()
		}
	},
	props: {
		showTape: {
			type: Boolean,
			default: true
		},
		tools: {
			type: String,
			default: 'time, tape, backward, play, forward, SPK-L, SPK-R, volume, loop, download'
		},
		wavesurferOptions: {
			type: Object,
			default() {
				return {}
			}
		},
		wavesurferTapeOptions: {
			type: Object,
			default() {
				return {}
			}
		},
		timelineOptions: {
			type: Object,
			default() {
				return {}
			}
		},
		defaultTheme: {
			default: 'light',
			validator: function (value) {
				return ['light', 'dark'].indexOf(value) !== -1
			}
		}
	},
	computed: {
		channelCh() {
			return this.channel & channelFlags.right ? '右声道' : this.channel & channelFlags.left ? '左声道' : '双声道'
		},
		volumeClass() {
			return `${
				this.mute
					? 'icon-volume-x'
					: this.volume > 0.6
					? 'icon-volume-f'
					: this.volume > 0
					? 'icon-volume-s'
					: 'icon-mute'
			} icon-control`
		},
		playClass() {
			return `${this.isPlaying ? 'icon-pause' : 'icon-play'}`
		},
		toolsArray() {
			const array = this.tools.split(',')
			array.forEach((cv) => cv.trim())
			return array
		}
	},
	methods: {
		waveControl() {
			this.myWave && this.myWave.initPlugin('spectrogram')
		},
		tvControl() {
			this.showTape = !this.showTape
			!this.showTape ? this.myWaveTape.destroy() : this.initWaveSurferTape()

			this.loadAudio(this.audioSource, this.myWaveTape || this.myWave)
		},
		playControl() {
			this.myWave.playPause()
			this.isPlaying = this.myWave.isPlaying()
		},
		volumeControl() {
			const myWave = this.myWave
			myWave.toggleMute()
			this.mute = myWave.getMute()
		},
		channelControl(channel) {
			console.log(this.currAudioBuffer, this.channel)
			if (!this.currAudioBuffer || this.channel === channel) return false
			const flag = channelFlags[channel]
			this.channel = flag || this.channel >> 1 || 4
			let leftAudioArray, rightAudioArray
			if (this.channel & channelFlags.right) {
				rightAudioArray = this.rightAudioArray
				leftAudioArray = this.nullArray
			} else if (this.channel & channelFlags.left) {
				leftAudioArray = this.leftAudioArray
				rightAudioArray = this.nullArray
			} else if (this.channel & channelFlags.both) {
				leftAudioArray = this.leftAudioArray
				rightAudioArray = this.rightAudioArray
			}
			this.currAudioBuffer.copyToChannel(leftAudioArray, 0, 0)
			this.currAudioBuffer.copyToChannel(rightAudioArray, 1, 0)
			this.myWave.drawBuffer()
			// this.myWave.play()
		},
		loopControl() {},
		listControl(type) {
			console.log(this.playIndex)
			const num = this.audioList.length
			if (type === 'forward') {
				this.playIndex++
			} else if (type === 'backward') {
				this.playIndex--
			}
			if (this.playIndex < 0) {
				this.playIndex = num - 1
			} else if (this.playIndex >= num) {
				this.playIndex = 0
			}
			console.log(this.playIndex)
			this.loadAudio()
		},
		skipControl(type, seconds) {
			if (type === 'forward') {
				this.myWave.skipForward(seconds || 2)
			} else if (type === 'backward') {
				this.myWave.skipBackward(seconds || 2)
			}
		},
		downloadControl() {
			if (!this.focusedRegion) {
				console.info('[Info]请选定一个region进行下载')
				return this.$emit('err', '请选定一个region进行下载')
			}
			const { start, end, wavesurfer } = this.focusedRegion
			const audioBuffer = copyAudioBuffer(wavesurfer.backend.buffer, start, end)
			const blob = bufferToWave(audioBuffer)
			downloadBlob(blob)
		},
		themeControl() {
			//    light dark
			this.themeType = this.themeType === 'light' ? 'dark' : 'light'
			this.theme = waveTheme[this.themeType]
			const { defaultOptions, defaultTapeOptions } = this.theme
			console.log(defaultOptions.backgroundColor)
			this.myWave.setBackgroundColor(defaultOptions.backgroundColor)
			this.myWave.setCursorColor(defaultOptions.cursorColor)
			this.myWave.setProgressColor(defaultOptions.progressColor)
			this.myWave.setWaveColor(defaultOptions.waveColor)
			//
			this.myWaveTape.setBackgroundColor(defaultTapeOptions.backgroundColor)
			this.myWaveTape.setCursorColor(defaultOptions.cursorColor)
			this.myWaveTape.setProgressColor(defaultOptions.progressColor)
			this.myWaveTape.setWaveColor(defaultOptions.waveColor)

			// 修改背景色
			this.wrapBackgroundColor = defaultOptions.wrapBackgroundColor
			this.myWave.timeline.container.style.backgroundColor = defaultOptions.backgroundColor
		},
		deleteRegion(event) {
			const whichNum = [8, 110, 46]
			if (!whichNum.includes(event.which) || !this.focusedRegion) return false
			this.focusedRegion && this.focusedRegion.remove()
		},
		PlayList(list, index = 0) {
			this.audioList = list
			this.playIndex = index
			this.audioSource = list[index]
			let wave = this.showTape ? this.myWaveTape : this.myWave
			console.log(this.showTape)
			if (wave) {
				wave.load(this.audioSource)
			}
		},
		loadAudio() {
			if (!this.audioList || this.playIndex == null) return false
			console.log(this.audioList, this.playIndex)
			let wave = this.showTape ? this.myWaveTape : this.myWave
			if (wave) {
				wave.load(this.audioList[this.playIndex])
			}
		},
		updateWaveForm(wave, audioBuffer, start) {
			if (wave.timeline) {
				const startRound = Math.round(start) || 0
				wave.timeline.params.formatTimeCallback = function (seconds, pxPerSec) {
					return wave.timeline.defaultFormatTimeCallback(seconds + startRound, pxPerSec)
				}
				// wave.timeline.render()
			}
			wave.peakCache && wave.peakCache.clearPeakCache && wave.peakCache.clearPeakCache()
			// 转为blob，重新加载
			const blob = bufferToWave(audioBuffer)
			wave.loadBlob(blob)
		},
		initWaveSurferTape() {
			if (!this.showTape) return false
			const { defaultTapeOptions, defaultTapeRegionsOptions } = this.theme
			const myWaveTape = (this.myWaveTape = WaveSurfer.create(
				Object.assign(defaultTapeOptions, this.wavesurferTapeOptions, {
					container: this.$refs.waveFormTape,
					plugins: [Regions.create()],
					cursorColor: 'transparent',
					splitChannels: false,
					interact: false
				})
			))

			const tapeRegion = 'tapeRegion'
			let regionOnTapeStart = 0,
				regionOnTapeEnd = 0
			myWaveTape.on('ready', () => {
				console.log('myWaveTape ready')
				const duration = myWaveTape.getDuration()
				regionOnTapeEnd = duration //  / 2
				myWaveTape.clearRegions && myWaveTape.clearRegions()
				// myWaveTape.disableDragSelection({
				//     // slop: 10, 默认为2
				//     color: 'rgba(0, 0, 0, 0.2)'
				// })
				myWaveTape.addRegion({
					id: tapeRegion,
					start: regionOnTapeStart,
					end: regionOnTapeEnd,
					...defaultTapeRegionsOptions,
					minLength: duration / 10,
					resize: true,
					drag: true
				})
				const audioBuffer = copyAudioBuffer(myWaveTape.backend.buffer, regionOnTapeStart, regionOnTapeEnd)
				this.updateWaveForm(this.myWave, audioBuffer, regionOnTapeStart)
			})

			myWaveTape.on('loading', (percents) => (this.percents = percents))
			myWaveTape.on('region-update-end', (region) => {
				const { id, start, end } = region
				if (id === tapeRegion) {
					// regionOnWholeLastStart = regionOnTapeStart
					regionOnTapeStart = start
					regionOnTapeEnd = end

					const audioBuffer = copyAudioBuffer(myWaveTape.backend.buffer, regionOnTapeStart, regionOnTapeEnd)
					this.updateWaveForm(this.myWave, audioBuffer, regionOnTapeStart)
				}
			})
			myWaveTape.on('destroy', () => {
				this.myWaveTape = null
			})
		},
		eventOnWave() {
			const myWave = this.myWave
			myWave.on('waveform-ready', () => {
				console.log(this.myWave.backend.buffer.numberOfChannels)
				console.log('waveform-ready')
				// 加载完毕 缓存声道数据,用于左右声道切换
				const currentAudioBufferCache = (this.currAudioBuffer =
					this.myWave && this.myWave.backend && this.myWave.backend.buffer)
				if (currentAudioBufferCache && currentAudioBufferCache.numberOfChannels === 2) {
					this.nullArray = new Float32Array(currentAudioBufferCache.length)
					this.leftAudioArray = new Float32Array(currentAudioBufferCache.length)
					this.rightAudioArray = new Float32Array(currentAudioBufferCache.length)
					currentAudioBufferCache.copyFromChannel(this.leftAudioArray, 0, 0)
					currentAudioBufferCache.copyFromChannel(this.rightAudioArray, 1, 0)
					this.myWave.clearPeakCache && this.myWave.clearPeakCache()
					this.myWave.drawBuffer()
					console.log(currentAudioBufferCache)
				}
			})
			myWave.on('ready', () => {
				console.log('ready')
				this.audioLoaded = true
				this.percents = -1
				this.time = '00:00'
				this.duration = '00:00'
				this.isPlaying = false
				myWave.enableDragSelection(this.theme.defaultRegionsOptions)
				this.myWave.setVolume(1)
				this.volume = this.myWave.getVolume()
				const duration = this.myWave.getDuration()
				this.duration = seconds2Minutes(duration)
				this.currAudioBuffer = this.myWave.backend.buffer
				console.log('this.currAudioBuffer', this.currAudioBuffer)
				// 加载完毕 缓存声道数据,用于左右声道切换
				let currentAudioBufferCache = this.currAudioBuffer
				if (currentAudioBufferCache && currentAudioBufferCache.numberOfChannels === 2) {
					console.log('currentAudioBufferCache', currentAudioBufferCache)
					// this.myWave.backend.buffer = currentAudioBufferCache.buffer._buffer

					this.nullArray = new Float32Array(currentAudioBufferCache.length)
					this.leftAudioArray = new Float32Array(currentAudioBufferCache.length)
					this.rightAudioArray = new Float32Array(currentAudioBufferCache.length)
					currentAudioBufferCache.copyFromChannel(this.leftAudioArray, 0, 0)
					currentAudioBufferCache.copyFromChannel(this.rightAudioArray, 1, 0)
					this.myWave.clearPeakCache && this.myWave.clearPeakCache()
					this.myWave.drawBuffer()
				}
			})
			const _time = throttle((time) => {
				this.time = time
			}, 500)

			myWave.on('audioprocess', (process) => _time(seconds2Minutes(process)))

			myWave.on('loading', (percents) => (this.percents = percents))

			myWave.on('finish', () => {
				this.isPlaying = false
			})

			myWave.on('seek', (process) => {
				const seconds = process * this.myWave.getDuration()
				this.time = seconds2Minutes(seconds)
			})
			myWave.on('region-click', (region, event) => {
				console.log(event)
				const focusedRegion = this.focusedRegion
				if (focusedRegion) {
					focusedRegion.color = focusedRegion.isCache
						? 'rgba(252, 167, 26, 0.5)'
						: 'rgba(255, 255, 255, 0.45)'
					focusedRegion.updateRender()
				}
				region.color = 'rgba(255, 120, 81, 0.8)'
				region.updateRender()
				this.focusedRegion = region
				this.$emit('focused-region', region)
			})

			myWave.on('destroy', () => {
				this.myWave = null
			})
		},
		initPlugins() {},
		initWaveSurfer() {
			this.audioLoaded = false

			const { defaultTimelineOptions, defaultOptions } = this.theme
			const timelineOptions = Object.assign(defaultTimelineOptions, this.timelineOptions, {
				container: this.$refs.waveTime
			})

			const spectrogramOptions = {
				container: this.$refs.waveSpectrogram,
				deferInit: false
				// colorMap
			}
			const constantOptions = {
				container: this.$refs.waveForm,
				plugins: [Regions.create(), Timeline.create(timelineOptions), Spectrogram.create(spectrogramOptions)]
			}
			Object.assign(defaultOptions, this.wavesurferOptions, constantOptions)
			this.waveformHeight = defaultOptions.height * (defaultOptions.splitChannels ? 2 : 1) + 'px'
			this.myWave = WaveSurfer.create(defaultOptions)

			this.wrapBackgroundColor = defaultOptions.wrapBackgroundColor
			this.eventOnWave()
		}
	},
	mounted() {
		this.themeType = this.defaultTheme
		this.theme = waveTheme[this.themeType] || waveTheme.dark
		console.log(this.theme, 'this.theme')
		// 尝试加载tape图谱
		this.initWaveSurfer()
		this.initWaveSurferTape()
	}
}
</script>

<style scoped lang="scss">
.wavesurfer-wrap {
	padding: 5px 10px;
	font-size: 16px;
	/*background-color: #071E47;*/
	position: relative;
	overflow: hidden;

	&:focus {
		border: none;
		outline: none;
	}

	.wave-spectrogram {
		display: none;
		visibility: hidden;
	}

	.wave-tools {
		height: 2em;
		display: flex;
		align-items: center;
		justify-content: flex-start;

		.icon-control {
			margin: 0 0.3em;
			font-size: 22px;
			cursor: pointer;
			user-select: unset;
		}

		.wave-time {
			margin: 0 0.3em;
			.time-process,
			.time-duration {
				width: 3em;
				text-align: center;
				font-size: 16px;
			}
			.time-split {
				width: 1em;
				text-align: center;
				font-size: 16px;
			}
		}

		.icon-loader.icon-control {
			width: 5em;
			text-align: center;
		}
	}

	&.light {
		.wave-tools {
			.icon-control {
				color: #999999;
				&:active,
				&.active {
					color: #666666;
				}
			}

			.wave-time {
				.time-process,
				.time-duration,
				.time-split {
					color: #666666;
				}
			}
		}
	}

	&.dark {
		.wave-tools {
			.icon-control {
				color: #fff;
				&:active,
				&.active {
					color: red;
				}
			}

			.wave-time {
				.time-process,
				.time-duration,
				.time-split {
					color: #fff;
				}
			}
		}
	}

	.progress {
		margin-top: -8px;
		max-width: calc(100% - 20px);
		position: absolute;
		left: 10px;
		right: 10px;
		top: 50%;
		height: 15px;
		z-index: 1;
		overflow: hidden;

		&::before {
			position: absolute;
			left: 0;
			top: 0;
			content: '';
			width: 100%;
			height: 100%;
			box-sizing: border-box;
			background-clip: content-box;
			background-image: linear-gradient(
				45deg,
				rgba(255, 255, 255, 0.15) 25%,
				transparent 25%,
				transparent 50%,
				rgba(255, 255, 255, 0.15) 50%,
				rgba(255, 255, 255, 0.15) 75%,
				transparent 75%,
				transparent
			);
			background-color: #337ab7;
			background-repeat: repeat;
			background-size: 40px 40px;
			transition: width 0.6s ease;
			animation: progress-bar-stripes 2s linear infinite;
			border-radius: 5px;
			z-index: 1;
		}

		@keyframes progress-bar-stripes {
			from {
				background-position: 0 0;
			}
			to {
				background-position: -80px 0;
			}
		}
	}
}
</style>
