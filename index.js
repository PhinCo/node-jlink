( function(){

	const jlinkexe = require('./lib/jlinkexe');
	const utils = require('./lib/utils');
	const isInstalled = require('./lib/is_installed');

	let debug = false;

	exports.jlinkexe = jlinkexe;

	exports.setDebug = function( flag ){
		debug = flag;
		jlinkexe.setDebug = flag;
	};

	exports.setJlinkEXECommand = function( command ){
		jlinkexe.JLinkExe = command;
	};

	exports.setJLinkEXEOptions = function( optionsString ){
		jlinkexe.JLinkExeOptions = optionsString;
	};

	exports.isJLinkEXEInstalled = function(){
		return isInstalled( jlinkexe.JLinkExe );
	};

	function _perform( commands ){
		return jlinkexe.executeJlinkCommands( commands, { debug: debug } )
		.then( function( result ){
			return ( result.code === 0 && !result.error );
		});
	}

	const _commands = {
		reset: ["w4 40000544 1", "si 0","tck0", "t0", "t1", "sleep 10" ],
		pinReset: ["w4 40000544 1", "r" ],
		eraseAll: ["h", "w4 4001e504 2", "w4 4001e50c 1", "sleep 100", "r"]
	};

	/**
	 * @return Promise, resolve( true ) or reject( Error )
	 */
	exports.reset = function(){
		return _perform( _commands.reset );
	};

	/**
	 * @return Promise, resolve( true ) or reject( Error )
	 */
	exports.pinReset = function(){
		return _perform( _commands.pinReset );
	};

	/**
	 * @return Promise, resolve( true ) or reject( Error )
	 */
	exports.eraseAll = function(){
		return _perform( _commands.eraseAll );
	};

	/**
	 * @return Promise, resolve( true ) or reject( Error )
	 */
	exports.program = function( firmwareFilePath ){
		if( !firmwareFilePath ) throw new Error("node-jlink: flash() requires firmwareFilePath");
		return jlinkexe.executeJlinkCommands( ["r", "h", "loadfile " + firmwareFilePath, "r", "g" ], { debug: debug })
		.then( function( result ){
			return ( result.code === 0 && !result.error );
		});
	};

	/**
	 *
	 * @param address: must be word aligned (default 0)
	 * @param numBytes: must be word aligned (default 4)
	 * @return Promise, resolve( Buffer ) or reject( Error )
	 */
	exports.readmem = function( address, numBytes ){
		if( address === void 0 ) address = 0x00000000;
		if( numBytes === void 0 ) numBytes = 4;
		if( address % 4 !== 0 ) throw new Error("node-jlink: readmMem() address must be 32 bit aligned");
		if( numBytes % 4 !== 0 ) throw new Error("node-jlink: readmMem() numBytes must be 32 bit aligned");

		const memCommand = `mem 0x${utils.numberToHexString( address, 8)}, 0x${utils.numberToHexString( numBytes, 8 )}`;
		return jlinkexe.executeJlinkCommands( ["h", memCommand ], { debug: debug } )
			.then( function( result ){
				console.error( `stdout: \n${result.stdout}\n`)
				console.error( `parseMemoryStringToBuffer( ${utils.numberToHexString(address, 8)}, ${numBytes} )`);
				return jlinkexe.parseMemoryStringToBuffer( result.stdout, address, numBytes );
			})
			.catch( function(error){
				console.error( `Failed to read ${numBytes} bytes from 0x${utils.numberToHexString(address, 8)}`);
				console.error( `Command was: "${memCommand}"`);
				throw error;
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

	exports.identify = function(){
		return jlinkexe.executeJlinkCommands()
			.then( function( result ){
				return jlinkexe.parseJLinkVersionInfo( result.stdout );
			})
			// .catch( function( error ){
			// 	if( error && error.message && error.message.indexOf("Can not connect") !== -1 ){
			// 		return Promise.reject( new Error( "node-jlink: Could not connect to JLink"));
			// 	}
			// 	return Promise.reject( )
			// });
	};

	exports.resume = function(){
		return jlinkexe.executeJlinkCommands( ["g"], { debug: debug })
		.then( function( result ){
			return ( result.code === 0 && !result.error );
		});
	};

	/**
	 *
	 * @param arrayOfCommands
	 * @param options
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

	exports.executeCommands = function( arrayOfCommands, options ){
		if( !options ) options = { debug: debug };
		return jlinkexe.executeJlinkCommands( arrayOfCommands, options );
	}

})();
