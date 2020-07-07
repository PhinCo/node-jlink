( function(){

	const jlink = require("../../index");
	const utils = require("../../lib/utils");

	jlink.setDebug( false );

	return jlink.isJLinkEXEInstalled()
	// .then( isInstalled => {
	// 	console.log( 'JLinkEXE isInstalled = ', isInstalled );
	// })
	// .then( () => {
	// 	console.log("Erase All");
	// 	return jlink.eraseAll();
	// })
	// .then( () => {
	// 	console.log("Programming");
	// 	return jlink.program( "./tests/data/merged_0.1.7.hex" )
	// })
	.then( () => {
		console.log("Reading 0x10001080 as Buffer");
		return jlink.readmem( 0x10001080, 0x4 )
	})
	.then( function( buffer ){
		console.log("Buffer 0x10001080");
		console.log( buffer );
	})
	.then( () => {
		console.log("Reading 0x10001080 as word, LE");
		return jlink.readWordLE( 0x10001080 );
	})
	.then( word => {
		console.log("Word 0x10001080");
		console.log( utils.numberToHexString( word, 8));
	})
	.then( () => {
		console.log("Reading jlink id");
		return jlink.identify();
	})
	.then( identity => {
		console.log("Identify Response");
		console.log( identity );
	})
	.then( () => {
		console.log("resetting");
		return jlink.reset();
	})
	.then( function( result ){
		console.log( "Reset Result: ", result );
	})
	.catch( function( error ){
		console.log("Test Failed: " + error.message );
	});

})();
