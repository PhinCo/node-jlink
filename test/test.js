( function(){
	var jlink = require("../index");
	var utils = require("../lib/utils");
	return jlink.isJLinkEXEInstalled()
	.then( function( isInstalled ){
		console.log( 'JLinkEXE isInstalled = ', isInstalled );
	})
	.then( function(){
		return jlink.readmem( 0x000000000, 0x4 )
	})
	.then( function( buffer ){
		console.log( buffer );
	})
	.then( function( buffer ){
		return jlink.readWordLE( 0x00000000 );
	})
	.then( function( word ){
		console.log( utils.numberToHexString( word, 8));
	}).then( function() {
		return jlink.identify();
	}).then( function( identity ){
		console.log( identity );
	}).then( function(){
		return jlink.resume();
	})


// return jlink.reset()
// .then( function( result ){
// 	console.log( "Reset Result: ", result );
// })
	.catch( function( error ){
		console.log("Test Fail: ", error );
	});
})();