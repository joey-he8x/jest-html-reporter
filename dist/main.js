'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var fs = _interopDefault(require('fs'));
var mkdirp = _interopDefault(require('mkdirp'));
var xmlbuilder = _interopDefault(require('xmlbuilder'));
var stripAnsi = _interopDefault(require('strip-ansi'));
var dateformat = _interopDefault(require('dateformat'));

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

const config = {};

// Attempt to locate and assign configurations from package.json
try {
	const packageJson = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8');
	if (packageJson) {
		Object.assign(config, JSON.parse(packageJson)['jest-html-reporter']);
	}
} catch (e) { /** do nothing */ }
// Attempt to locate and assign configurations from jesthtmlreporter.config.json
try {
	const jesthtmlreporterconfig = fs.readFileSync(path.join(process.cwd(), 'jesthtmlreporter.config.json'), 'utf8');
	if (jesthtmlreporterconfig) {
		Object.assign(config, JSON.parse(jesthtmlreporterconfig));
	}
} catch (e) { /** do nothing */ }

/**
 * Returns the output path for the test report
 * @return {String}
 */
const getOutputFilepath = () =>
	config.outputPath || process.env.JEST_HTML_REPORTER_OUTPUT_PATH || path.join(process.cwd(), 'test-report.html');

/**
 * Returns the configured name of theme to be used for styling the report
 * @return {String}
 */
const getTheme = () =>
	config.theme || process.env.JEST_HTML_REPORTER_THEME || 'defaultTheme';

/**
 * Returns the style-override path for the test report
 * @return {String}
 */
const getStylesheetFilepath = () =>
	config.styleOverridePath || process.env.JEST_HTML_REPORTER_STYLE_OVERRIDE_PATH || path.join(__dirname, `../style/${getTheme()}.css`);

/**
 * Returns the configured test report title
 * @return {String}
 */
const getPageTitle = () =>
	config.pageTitle || process.env.JEST_HTML_REPORTER_PAGE_TITLE || 'Test report';

/**
 * Returns whether the report should contain failure messages or not
 * @return {Boolean}
 */
const shouldIncludeFailureMessages = () =>
	config.includeFailureMsg || process.env.JEST_HTML_REPORTER_INCLUDE_FAILURE_MSG || false;

/**
 * Returns the configured threshold (in seconds) when to apply a warning
 * @return {Number}
 */
const getExecutionTimeWarningThreshold = () =>
	config.executionTimeWarningThreshold || process.env.JEST_HTML_REPORTER_EXECUTION_TIME_WARNING_THRESHOLD || 5;

/**
 * Returns the configured date/time format.
 * Uses DateFormat - https://github.com/felixge/node-dateformat
 * @return {String}
 */
const getDateFormat = () =>
	config.dateFormat || process.env.JEST_HTML_REPORTER_DATE_FORMAT || 'yyyy-mm-dd HH:MM:ss';

const getSort = () =>
	config.sort || process.env.JEST_HTML_REPORTER_SORT || 'default';

var config_1 = {
	config,
	getOutputFilepath,
	getStylesheetFilepath,
	getPageTitle,
	shouldIncludeFailureMessages,
	getExecutionTimeWarningThreshold,
	getTheme,
	getDateFormat,
	getSort,
};

var sorting = createCommonjsModule(function (module) {
/**
 * Splits test suites apart based on individual test status and sorts by that status:
 * 1. Pending
 * 2. Failed
 * 3. Passed
 * @param {Object} suiteResults
 */
const sortSuiteResultsByStatus = (suiteResults) => {
	const pendingSuites = [];
	const failingSuites = [];
	const passingSuites = [];

	suiteResults.forEach((suiteResult) => {
		const pending = [];
		const failed = [];
		const passed = [];

		suiteResult.testResults.forEach((x) => {
			if (x.status === 'pending') {
				pending.push(x);
			} else if (x.status === 'failed') {
				failed.push(x);
			} else {
				passed.push(x);
			}
		});

		if (pending.length) {
			pendingSuites.push(Object.assign({}, suiteResult, { testResults: pending }));
		}
		if (failed.length) {
			failingSuites.push(Object.assign({}, suiteResult, { testResults: failed }));
		}
		if (passed.length) {
			passingSuites.push(Object.assign({}, suiteResult, { testResults: passed }));
		}
	});

	return [].concat(pendingSuites, failingSuites, passingSuites);
};

/**
 * Sorts test suite results
 * If sort is undefined or is not a supported value this has no effect
 * @param {Object} suiteResults
 * @param {String} sort The configured sort
 */
const sortSuiteResults = (suiteResults, sort) => {
	if (sort === 'status') {
		return sortSuiteResultsByStatus(suiteResults);
	}

	return suiteResults;
};

module.exports = {
	sortSuiteResults,
	sortSuiteResultsByStatus,
};
});

var sorting_1 = sorting.sortSuiteResults;
var sorting_2 = sorting.sortSuiteResultsByStatus;

var methods = createCommonjsModule(function (module) {
/**
 * Logs a message of a given type in the terminal
 * @param {String} type
 * @param {String} msg
 * @return {Object}
 */
const logMessage = ({ type, msg, ignoreConsole }) => {
	const logTypes = {
		default: '\x1b[37m%s\x1b[0m',
		success: '\x1b[32m%s\x1b[0m',
		error: '\x1b[31m%s\x1b[0m',
	};
	const logColor = (!logTypes[type]) ? logTypes.default : logTypes[type];
	const logMsg = `jest-html-reporter >> ${msg}`;
	if (!ignoreConsole) {
		console.log(logColor, logMsg); // eslint-disable-line
	}
	return { logColor, logMsg }; // Return for testing purposes
};

/**
 * Processes an array of test suite results
 * @param {Object} suiteResults
 * @return {Object}
 */
const processSuiteResults = (suiteResults) => {
	const processedTestResults = sorting.sortSuiteResults(suiteResults, config_1.getSort());
	return processedTestResults;
};

/**
 * Creates a file at the given destination
 * @param  {String} filePath
 * @param  {Any} 	content
 */
const writeFile = (filePath, content) => new Promise((resolve, reject) => {
	mkdirp(path.dirname(filePath), (err) => {
		if (err) {
			return reject(new Error(`Something went wrong when creating the file: ${err}`));
		}
		return resolve(fs.writeFileSync(filePath, content));
	});
});

/**
 * Returns the stylesheet to be requireed in the test report.
 * If styleOverridePath is not defined, it will return the default stylesheet (style.js).
 * @param  {String} filePath
 * @return {Promise}
 */
const getStylesheet = () => new Promise((resolve, reject) => {
	const pathToStylesheet = config_1.getStylesheetFilepath();
	fs.readFile(pathToStylesheet, 'utf8', (err, content) => {
		if (err) {
			return reject(new Error(`Could not locate the stylesheet: '${pathToStylesheet}': ${err}`));
		}
		return resolve(content);
	});
});
/**
 * Sets up a basic HTML page to apply the content to
 * @return {xmlbuilder}
 */
const createHtml = stylesheet => xmlbuilder.create({
	html: {
		head: {
			meta: { '@charset': 'utf-8' },
			title: { '#text': config_1.getPageTitle() },
			style: { '@type': 'text/css', '#text': stylesheet },
		},
		body: {
			h1: { '@id': 'title', '#text': config_1.getPageTitle() },
		},
	},
});
/**
 * Returns a HTML containing the test report.
 * @param  {String} stylesheet
 * @param  {Object} testData		The test result data
 * @return {xmlbuilder}
 */
const renderHTML = (testData, stylesheet) => new Promise((resolve, reject) => {
	// Make sure that test data was provided
	if (!testData) { return reject(new Error('Test data missing or malformed')); }

	// Create an xmlbuilder object with HTML and Body tags
	const htmlOutput = createHtml(stylesheet);

	const metaDataContainer = htmlOutput.ele('div', { id: 'metadata-container' });

	// Timestamp
	const timestamp = new Date(testData.startTime);
	metaDataContainer.ele('div', { id: 'timestamp' }, `Start: ${dateformat(timestamp, config_1.getDateFormat())}`);

	// Test Summary
	metaDataContainer.ele('div', { id: 'summary' }, `
		${testData.numTotalTests} tests --
		${testData.numPassedTests} passed /
		${testData.numFailedTests} failed /
		${testData.numPendingTests} pending
	`);

	const processedSuiteResults = processSuiteResults(testData.testResults);

	// Test Suites
	processedSuiteResults.forEach((suite) => {
		if (!suite.testResults || suite.testResults.length <= 0) { return; }

		// Suite Information
		const suiteInfo = htmlOutput.ele('div', { class: 'suite-info' });
		// Suite Path
		suiteInfo.ele('div', { class: 'suite-path' }, suite.testFilePath);
		// Suite execution time
		const executionTime = (suite.perfStats.end - suite.perfStats.start) / 1000;
		suiteInfo.ele('div', { class: `suite-time${executionTime > 5 ? ' warn' : ''}` }, `${executionTime}s`);

		// Suite Test Table
		const suiteTable = htmlOutput.ele('table', { class: 'suite-table', cellspacing: '0', cellpadding: '0' });

		// Test Results
		suite.testResults.forEach((test) => {
			const testTr = suiteTable.ele('tr', { class: test.status });

			// Suite Name(s)
			testTr.ele('td', { class: 'suite' }, test.ancestorTitles.join(' > '));

			// Test name
			const testTitleTd = testTr.ele('td', { class: 'test' }, test.title);

			// Test Failure Messages
			if (test.failureMessages && (config_1.shouldIncludeFailureMessages())) {
				const failureMsgDiv = testTitleTd.ele('div', { class: 'failureMessages' });
				test.failureMessages.forEach((failureMsg) => {
					failureMsgDiv.ele('p', { class: 'failureMsg' }, stripAnsi(failureMsg));
				});
			}

			// Append data to <tr>
			testTr.ele('td', { class: 'result' }, (test.status === 'passed') ? `${test.status} in ${test.duration / 1000}s` : test.status);
		});
	});
	return resolve(htmlOutput);
});
/**
 * Generates and writes HTML report to a given path
 * @param  {Object} testData   Jest test information data
 * @return {Promise}
 */
const createReport = (testData, ignoreConsole) => {
	const destination = config_1.getOutputFilepath();

	return getStylesheet()
		.then(renderHTML.bind(null, testData))
		.then(writeFile.bind(null, destination))
		.then(() => logMessage({
			type: 'success',
			msg: `Report generated (${destination})`,
			ignoreConsole,
		}))
		.catch(error => logMessage({
			type: 'error',
			msg: error,
			ignoreConsole,
		}));
};

module.exports = {
	logMessage,
	processSuiteResults,
	writeFile,
	createReport,
	createHtml,
	renderHTML,
};
});

var methods_1 = methods.logMessage;
var methods_2 = methods.processSuiteResults;
var methods_3 = methods.writeFile;
var methods_4 = methods.createReport;
var methods_5 = methods.createHtml;
var methods_6 = methods.renderHTML;

class HtmlReporter {
	constructor(globalConfig, options) {
		this._globalConfig = globalConfig;
		this._options = options;
	}

	onRunComplete(contexts, results) {
		return methods.createReport(results);
	}
}

var src = HtmlReporter;

module.exports = src;
