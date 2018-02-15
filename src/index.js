const methods = require('./methods');

class HtmlReporter {
	constructor(globalConfig, options) {
		this._globalConfig = globalConfig;
		this._options = options;
	}

	onRunComplete(contexts, results) {
		return methods.createReport(results);
	}
}

module.exports = HtmlReporter;
