( function(){

	var jlinkexe = require('./lib/jlinkexe');
	var utils = require('./lib/utils');

	exports.jlinkexe = jlinkexe;

	exports.setJlinkEXECommand = function( command ){
		jlinkexe.JLinkExe = command;
	};

	exports.setJLinkEXEOptions = function( optionsString ){
		jlinkexe.JLinkExeOptions = optionsString;
	};

	exports.isJLinkEXEInstalled = function(){
		return jlinkexe.executeJlinkCommands( ["exit"] )
		.then( function( result ){
			return ( result.code === 0 && !result.error );
		});

	};

	/**
	 * @return Promise, resolve( true ) or reject( Error )
	 */
	exports.reset = function(){
		return jlinkexe.executeJlinkCommands( ["r","g"] )
		.then( function( result ){
			return ( result.code === 0 && !result.error );
		});
	};

	/**
	 * @return Promise, resolve( true ) or reject( Error )
	 */
	exports.pinReset = function(){
		return jlinkexe.executeJlinkCommands( ["w4 40000544 1", "r"])
		.then( function( result ){
			return ( result.code === 0 && !result.error );
		});
	};

	/**
	 * @return Promise, resolve( true ) or reject( Error )
	 */
	exports.eraseAll = function(){
		return jlinkexe.executeJlinkCommands( ["h", "w4 4001e504 2", "w4 4001e50c 1", "sleep 100", "r"])
		.then( function( result ){
			return ( result.code === 0 && !result.error );
		});
	};

	/**
	 * @return Promise, resolve( true ) or reject( Error )
	 */
	exports.program = function( firmwareFilePath ){
		if( !firmwareFilePath ) throw new Error("node-jlink: flash() requires firmwareFilePath");
		return jlinkexe.executeJlinkCommands( ["r", "h", "loadfile " + firmwareFilePath, "r", "g" ])
		.then( function( result ){
			return ( result.code === 0 && !result.error );
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

	exports.identify = function(){
		function extractText( string, pattern ){
			var matches = string.match( pattern );
			if( matches && matches.length >= 2 ) return matches[1];
			return null;
		}

		return jlinkexe.executeJlinkCommands()
			.then( function( result ){
				var dllVersion = extractText( result.stdout, "DLL version V(.*)," );
				var serialNumber = extractText( result.stdout, "S\/N: (.*)" );
				var firmware = extractText( result.stdout, "Firmware: (.*)" );

				var output = {};
				if( dllVersion ) output.dllVersion = dllVersion;
				if( serialNumber ) output.serialNumber = serialNumber;
				if( firmware ) output.firmware = firmware;

				return output;
			})
			.catch( function( error ){
				if( error && error.message && error.message.indexOf("Can not connect") !== -1 ){
					return Promise.resolve();
				}
				throw error;
			});
	};

	exports.resume = function(){
		return jlinkexe.executeJlinkCommands( ["g"])
		.then( function( result ){
			return ( result.code === 0 && !result.error );
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