import log4js from 'log4js';

/**
 * log4js configuration data
 */
log4js.configure({
	appenders: {
		out:{ type: 'stdout' },
		trace: { type: 'file', filename: 'logs/application_trace.log', maxLogSize: 204800, backups: 3, keepFileExt: true },
		debug: { type: 'file', filename: 'logs/application_debug.log', maxLogSize: 204800, backups: 3, keepFileExt: true },
		info: { type: 'file', filename: 'logs/application.log', maxLogSize: 204800, backups: 3, keepFileExt: true },
		error: { type: 'file', filename: 'logs/application_error.log', maxLogSize: 204800, backups: 3, keepFileExt: true },
		trace_filter: { type: 'logLevelFilter', appender: 'trace', level: 'trace', maxLevel: 'trace' },
		debug_filter: { type: 'logLevelFilter', appender: 'debug', level: 'debug', maxLevel: 'debug' },
		info_filter: { type:'logLevelFilter', appender: 'info', level: 'info' },
		error_filter: { type:'logLevelFilter', appender: 'error', level: 'error' }
	},
	categories: {
		default: { appenders: [ 'trace_filter', 'debug_filter', 'info_filter', 'error_filter', 'out'], level: 'all' },
	}
});

export const logger = log4js.getLogger();

export const endLogger = log4js.shutdown;
