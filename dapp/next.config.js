const withTM = require('next-transpile-modules')(['d3']);

module.exports = withTM({
	reactStrictMode: false,
	env: {
		NETWORK: process.env.NETWORK,
	},
});
