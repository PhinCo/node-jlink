#!/usr/bin/env node

( function(){

	'use strict';

	const jlink = require('../index');
	const program = require('commander');

	program
	.option('-v, --verbose', 'set verbose output')
	.parse( process.argv );

	jlink.setDebug( program.verbose );

	return jlink.reset()
	.catch( function( error ){
		console.error( error.message );
		console.error("FAILED");
	});

})();
