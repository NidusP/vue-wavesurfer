export default {
	dark: {
		type: 'dark',
		defaultOptions: {
			wrapBackgroundColor: '#0a3550',
			height: 128,
			barWidth: 2,
			barRadius: 2,
			hideScrollbar: true,
			progressColor: '#00D595',
			waveColor: '#d58e00',
			cursorColor: '#ff1441',
			backgroundColor: '#000',
			splitChannels: true
		},
		defaultTimelineOptions: {
			notchPercentHeight: 60,
			unlabeledNotchColor: '#ffffff',
			primaryColor: '#ffffff',
			secondaryColor: '#ffffff',
			primaryFontColor: '#fafbff',
			secondaryFontColor: '#efeeff'
		},
		defaultRegionsOptions: {
			// slop: 10, 默认为2
			color: 'rgba(255, 255, 255, 0.45)',
			handleStyle: {
				left: {
					backgroundColor: 'rgba(255,255,255,1)',
					boxShadow: '0 0 2px 0 rgba(255,255,255,1)'
				},
				right: {
					backgroundColor: 'rgba(255,255,255,1)',
					boxShadow: '0 0 2px 0 rgba(255,255,255,1)'
				}
			}
		},
		defaultTapeRegionsOptions: {
			// slop: 10, 默认为2
			color: 'rgba(255, 255, 255, 0.35)',
			handleStyle: {
				left: {
					backgroundColor: 'rgba(255,255,255,1)',
					boxShadow: '0 0 2px 0 rgba(255,255,255,1)'
				},
				right: {
					backgroundColor: 'rgba(255,255,255,1)',
					boxShadow: '0 0 2px 0 rgba(255,255,255,1)'
				}
			}
		},
		defaultTapeOptions: {
			backgroundColor: '#000',
			waveColor: '#636363',
			progressColor: '#636363',
			barWidth: 2,
			barRadius: 2,
			height: 20
		}
	},
	light: {
		type: 'light',
		defaultOptions: {
			height: 128,
			barWidth: 2,
			barRadius: 2,
			audioRate: 1,
			backend: 'WebAudio', //MediaElementWebAudio   WebAudio MediaElement
			hideScrollbar: true,
			progressColor: '#55627c',
			waveColor: '#4CF0A5',
			cursorColor: '#ff1441',
			backgroundColor: '#000000',
			splitChannels: true,
			splitChannelsOptions: {
				// 0, 1
				filterChannels: []
			}
		},
		defaultTimelineOptions: {
			notchPercentHeight: 60,
			unlabeledNotchColor: '#000',
			primaryColor: '#ff3800',
			secondaryColor: '#000',
			primaryFontColor: '#000',
			secondaryFontColor: '#0c0c0c'
		},
		defaultRegionsOptions: {
			// slop: 10, 默认为2
			color: 'rgba(255, 255, 255, 0.35)'
		},
		defaultTapeRegionsOptions: {
			// slop: 10, 默认为2
			color: 'rgba(255, 255, 255, 0.55)'
		},
		defaultTapeOptions: {
			backgroundColor: '#000000',
			waveColor: '#c28c01',
			progressColor: '#c28c01',
			barWidth: 2,
			barRadius: 2,
			height: 25
		}
	}
}
