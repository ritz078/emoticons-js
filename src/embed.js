import extend from 'just-extend'
import pWaterfall from 'p-waterfall'
import isDom from 'is-dom'
import { appendEmbedsAtEnd } from './utils/dom'

function transformArray (plugins) {
	return plugins.map(p => p.transform)
}

function getPlugins (plugins = [], preset) {
	return preset ? plugins.concat(preset) : plugins
}

export default class EmbedJS {
	constructor (options) {
		const defaultOptions = {
			plugins: [],
			preset: null,
			inlineEmbed: true,
			replaceText: false,
			_embeds: [],
			_services: []
		}

		let {input, plugins, preset} = options
		if (!input) {
			throw new Error('You need to pass input element or string in the options object.')
		}

		this.inputString = input
		if (isDom(input)) {
			this.inputString = input.innerHTML
		}

		this.options = extend({}, defaultOptions, options, {
			result: this.inputString,
			plugins: getPlugins(plugins, preset)
		})
	}

	async _process () {
		const options = this.resetOptions()
		const {plugins} = options
		this.resultText = await pWaterfall(transformArray(plugins), options)
		return this.resultText
	}

	resetOptions() {
		return extend({}, this.options, {
			_embeds: []
		})
	}

	async text () {
		return this._process()
	}

	load () {
		this.options.plugins.forEach(p => p.onLoad && p.onLoad(this.options))
	}

	async render () {
		const { input, target, inlineEmbed } = this.options
		if (!isDom(input) && !(target && isDom(target))) {
			throw new Error('You haven\'t passed the input as an element.')
		}

		let options
		if (isDom(input) && input.classList.contains('ejs-applied')) {
			options = this.options
		} else {
			options = await this._process()

			const element = target || input
			element.innerHTML = inlineEmbed ? options.result : appendEmbedsAtEnd(options)
			element.className += " ejs-applied"
		}

		this.load()
		return options
	}
}
