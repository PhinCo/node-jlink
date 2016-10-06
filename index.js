( function(){

	var jlinkexe = require('./lib/jlinkexe');
	var utils = require('./lib/utils');

	exports.jlinkexe = jlinkexe;

	exports.setJLinkEXEOptions = function( optionsString ){
		jlinkexe.JLinkExeOptions = optionsString;
	};

	/**
	 * @return Promise, resolve( true ) or reject( Error )
	 */
	exports.reset = function(){
		return jlinkexe.executeJlinkCommands( ["r","g"] )
		.then( function( result ){
			if( result.error ) return Promise.reject( result.error );
			else return Promise.resolve( true );
		});
	};

	/**
	 * @return Promise, resolve( true ) or reject( Error )
	 */
	exports.pinReset = function(){
		return jlinkexe.executeJlinkCommands( ["w4 40000544 1", "r"])
		.then( function( result ){
			if( result.error ) return Promise.reject( result.error );
			else return Promise.resolve( true );
		});
	};

	/**
	 * @return Promise, resolve( true ) or reject( Error )
	 */
	exports.eraseAll = function(){
		return jlinkexe.executeJlinkCommands( ["h", "w4 4001e504 2", "w4 4001e50c 1", "sleep 100", "r"])
		.then( function( result ){
			if( result.error ) return Promise.reject( result.error );
			else return Promise.resolve( true );
		});
	};

	/**
	 * @return Promise, resolve( true ) or reject( Error )
	 */
	exports.program = function( firmwareFilePath ){
		if( !firmwareFilePath ) throw new Error("node-jlink: flash() requires firmwareFilePath");
		return jlinkexe.executeJlinkCommands( ["r", "h", "loadfile " + firmwareFilePath, "r", "g" ])
		.then( function( result ){
			if( result.error ) return Promise.reject( result.error );
			else return Promise.resolve( true );
		});
	};

	/**
	 *
	 * @param address: must be word aligned (default 0)
	 * @param numBytes: must be word aligend (default 4)
	 * @return Promise, resolve( Buffer ) or reject( Error )
	 */
	exports.readmem = function( address, numBytes ){
		if( address === void 0 ) address = 0x00000000;
		if( numBytes === void 0 ) numBytes = 4;
		if( address % 4 !== 0 ) throw new Error("node-jlink: readmMem() address must be 32 bit aligned");
		if( numBytes % 4 !== 0 ) throw new Error("node-jlink: readmMem() numBytes must be 32 bit aligned");

		var memCommand = "mem 0x" + utils.numberToHexString( address, 8) + ", 0x" + utils.numberToHexString( numBytes, 8 );
		return jlinkexe.executeJlinkCommands( ["h", memCommand ] )
		.then( function( result ){
			return jlinkexe.parseMemoryStringToBuffer( result.stdout, address, numBytes );
		});
	};

	exports.readWordLE = function( address ){
		return exports.readmem( address )
		.then( function( buffer ){
			return buffer.readUInt32LE(0);
		});
	};

	exports.readWordBE = function( address ){
		return exports.readmem( address )
		.then( function( buffer ){
			return buffer.readUInt32BE(0);
		});
	};

	/**
	 *
	 * @param arrayOfCommands
	 * @return Promise, resolve( Result ) or reject( Error )
	 *
	 * Result Format:
	 * {
	 * 		stdout: String, captured from jlinkexe stdout stream, or empty string
	 * 		stderr: String, captured from jlinkexe stdout stream, or empty string
	 * 		code: Integer, captured from jlinkexe exit code, or 0
	 * 		error: Error, from jlinkexe or internal error, or null
	 * 	}
	 */

	exports.executeCommands = function( arrayOfCommands ){
		return jlinkexe.executeJlinkCommands( arrayOfCommands );
	}

})();