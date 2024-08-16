import properties from '../amb.Properties';
import Logger from '../amb.Logger';

describe('Logger', () => {
	let outputMessage = '';
	console.log = jest.fn(input => (outputMessage = input));

	beforeEach(() => {
		outputMessage = '';
	});

	it('logs info message to console', () => {
		const logger = new Logger('test logger');
		logger.addInfoMessage('info');
		expect(outputMessage).toBe('test logger [INFO] info');
	});

	it('logs error message to console', () => {
		const logger = new Logger('test logger');
		logger.addErrorMessage('error');
		expect(outputMessage).toBe('test logger [ERROR] error');
	});

	it('does not log debug message if logLevel is not debug ', () => {
		const logger = new Logger('test logger');
		logger.debug("debug");
		expect(outputMessage).toBe('');
	});

	it('logs debug message if logLevel is debug ', () => {
		properties.logLevel = 'debug';
		const logger = new Logger('test logger');
		logger.debug("debug");
		expect(outputMessage).toBe('test logger [DEBUG] debug');
	});

	it('does not log if there is no console ', () => {
		global.console = undefined;
		const logger = new Logger('test logger');
		logger.debug("debug");
		expect(outputMessage).toBe('');
	});
});
