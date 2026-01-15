// Test script to verify dev login authentication
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load environment variables (simulate what the app does)
process.env.DEV_LOGIN = 'true';
process.env.AUTH_SECRET = 'secret';

// Test the authentication logic
const secretValue = 'secret';
const [secret, email = 'hello@webstudio.is'] = secretValue.split(':');

console.log('Testing dev login authentication:');
console.log('DEV_LOGIN:', process.env.DEV_LOGIN);
console.log('AUTH_SECRET:', process.env.AUTH_SECRET);
console.log('Input secret:', secret);
console.log('Expected secret:', process.env.AUTH_SECRET);
console.log('Secret matches:', secret === process.env.AUTH_SECRET);
console.log('Email:', email);