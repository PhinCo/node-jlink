#!/usr/bin/env node

( function(){

	'use strict';

	const jlink = require('../lib/jlinkexe');
	const program = require('commander');

	program
	.option('-v, --verbose', 'set verbose output')
	.arguments( "<commands>" )
	.parse( process.argv );

	if( !program.args || program.args.length === 0 ){
		console.log( "<commands> required");
		return;
	}

	return jlink.executeJlinkCommands( program.args, { debug: program.verbose } )
	.catch( function( error ){
		console.error( error.message );
		console.error("FAILED");
	});

})();
