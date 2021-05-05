#!/usr/bin/env node

( async function(){

	'use strict';

	const jlink = require('../index');
	const program = require('commander');

	program
		.option('-v, --verbose', 'set verbose output')
		.option( '-t, --test', 'only check that jlink exe is found and exit')
		.arguments( "<commands>" )
		.parse( process.argv );

	if( !program.test && (!program.args || program.args.length === 0 )){
		program.help()
		return;
	}

	const expectedJlinkExe = jlink.jlinkexe.JLinkExe
	if( !await jlink.isJLinkEXEInstalled() ){
		console.error(`${expectedJlinkExe} not found in path`)
		console.log(`Try installing the nrf command line tools, or ensure that ${expectedJlinkExe} is on your path`)
		console.log(`See https://www.nordicsemi.com/Software-and-tools/Development-Tools/nRF-Command-Line-Tools`)
		process.exit(1)
	}
	console.log(`${expectedJlinkExe} found in path`)

	if( program.test ){
		process.exit(0)
	}

	return jlink.executeCommands( program.args, { debug: program.verbose } )
	.catch( function( error ){
		console.error( error.message );
		console.error("FAILED");
	});

})();
