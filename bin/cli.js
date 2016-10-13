#!/usr/bin/env node

( function(){

	'use strict';

	var jlink = require('../lib/jlinkexe');
	var program = require('commander');

	program
	.arguments( "<commands>" )
	.parse( process.argv );

	if( !program.args || program.args.length === 0 ){
		console.log( "<commands> required");
		return;
	}

	jlink.executeJlinkCommands( program.args )
	.catch( function( error ){
		console.error( error.message );
	});

})();