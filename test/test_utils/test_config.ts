import 'dotenv/config';

/**
 * ServiceNow instance alias used for integration tests.
 * Configure via .env file or SN_INSTANCE_ALIAS environment variable.
 */
export const SN_INSTANCE_ALIAS: string = process.env.SN_INSTANCE_ALIAS || 'dev224436';
