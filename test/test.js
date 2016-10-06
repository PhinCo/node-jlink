( function(){
	var jlink = require("./../index.js");
	return jlink.readmem( 0x000000000, 0x40 )
	.then( function( buffer ){
		return jlink.reset()
		.then( function( result ){
			console.log( "Reset Result: ", result );
		})
	})
	.catch( function( error ){
		console.log("Test Fail: ", error );
	});
})();