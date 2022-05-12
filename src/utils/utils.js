/* eslint-disable no-unused-vars */
/* 部分代码来自：https://www.zhangxinxu.com/wordpress/2020/07/js-audio-clip-copy-upload/ */
// 节流
export const throttle = (fun, delay) => {
	let last, deferTimer
	return function (...rest) {
		let that = this
		// let _args = arguments
		let now = +new Date()
		if (last && now < last + delay) {
			clearTimeout(deferTimer)
			deferTimer = setTimeout(function () {
				last = now
				fun.apply(that, [...rest])
			}, delay)
		} else {
			last = now
			fun.apply(that, [...rest])
		}
	}
}
// 防抖
export function debounce(fun, delay) {
	return function (args) {
		let that = this
		let _args = args
		clearTimeout(fun.id)
		fun.id = setTimeout(function () {
			fun.call(that, _args)
		}, delay)
	}
}

export function downloadBlob(blob) {
	try {
		const downTag = document.createElement('a')
		downTag.href = URL.createObjectURL(blob)
		downTag.download = blob.name || 'download'
		downTag.style.display = 'none'
		document.body.appendChild(downTag)
		downTag.click()
		document.body.removeChild(downTag)
	} catch (e) {
		console.log(e)
		return e
	}
}

export function seconds2Minutes(seconds) {
	let minutes = Math.floor(seconds / 60),
		secondsOut = Math.floor(seconds % 60)
	minutes = minutes >= 10 ? minutes : `0${minutes}`
	secondsOut = secondsOut >= 10 ? secondsOut : `0${secondsOut}`
	return `${minutes}:${secondsOut}`
}

// Convert AudioBuffer to a Blob using WAVE representation
export function bufferToWave(abuffer, len) {
	let numOfChan = abuffer.numberOfChannels,
		length = (len || abuffer.length) * numOfChan * 2 + 44,
		buffer = new ArrayBuffer(length),
		view = new DataView(buffer),
		channels = [],
		i,
		sample,
		offset = 0,
		pos = 0

	// write WAVE header
	setUint32(0x46464952) // "RIFF"
	setUint32(length - 8) // file length - 8
	setUint32(0x45564157) // "WAVE"

	setUint32(0x20746d66) // "fmt " chunk
	setUint32(16) // length = 16
	setUint16(1) // PCM (uncompressed)
	setUint16(numOfChan)
	setUint32(abuffer.sampleRate)
	setUint32(abuffer.sampleRate * 2 * numOfChan) // avg. bytes/sec
	setUint16(numOfChan * 2) // block-align
	setUint16(16) // 16-bit (hardcoded in this demo)

	setUint32(0x61746164) // "data" - chunk
	setUint32(length - pos - 4) // chunk length

	// write interleaved data
	for (i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i))

	while (pos < length) {
		for (i = 0; i < numOfChan; i++) {
			// interleave channels
			sample = Math.max(-1, Math.min(1, channels[i][offset])) // clamp
			sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0 // scale to 16-bit signed int
			view.setInt16(pos, sample, true) // write 16-bit sample
			pos += 2
		}
		offset++ // next source sample
	}

	// create Blob
	return new Blob([buffer], { type: 'audio/wav' })

	function setUint16(data) {
		view.setUint16(pos, data, true)
		pos += 2
	}

	function setUint32(data) {
		view.setUint32(pos, data, true)
		pos += 4
	}
}

export function copyAudioBuffer(audioBuffer, start, end) {
	// 声道数量和采样率
	const channels = audioBuffer.numberOfChannels
	const rate = audioBuffer.sampleRate
	const duration = audioBuffer.duration
	// 截取时间
	const startOffset = rate * start,
		endOffset = rate * end
	// 对应的帧数
	let frameCount = endOffset - startOffset
	// 最小值 1 秒钟
	frameCount = frameCount < rate ? rate : frameCount
	// 创建同样采用率、同样声道数量，长度是指定时间的空的AudioBuffer
	const newAudioBuffer = new AudioContext().createBuffer(channels, frameCount, rate)
	// 创建临时的Array存放复制的buffer数据
	const anotherArray = new Float32Array(frameCount)
	// 声道的数据的复制和写入
	const offset = 0
	for (let channel = 0; channel < channels; channel++) {
		audioBuffer.copyFromChannel(anotherArray, channel, startOffset)
		newAudioBuffer.copyToChannel(anotherArray, channel, offset)
	}
	return newAudioBuffer
	// newAudioBuffer就是全新的复制的AudioBuffer对象
}
