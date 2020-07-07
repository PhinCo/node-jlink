( function(){

	// JlinkEXE Interfaces
	// Documentation Source: https://www.segger.com/admin/uploads/productDocs/UM08001_JLink.pdf

	const Promise = require("bluebird");
	const spawn = require('child_process').spawn;
	const utils = require('./utils');

	let debug = false;

	function JLinkError( message ){
		this.constructor.prototype.__proto__ = Error.prototype; // Make this an instanceof Error.
		Error.call(this);
		Error.captureStackTrace(this, this.constructor);
		this.name = this.constructor.name;
		this.message = message;
	}

	JLinkError.withExecResult = function( execResult ){
		if( !execResult ) return new JLinkError( "JLink command failed" );
		let text = execResult.stdout;
		if( text && text.length > 0 ){
			if( text.indexOf("J-Link Commander will now exit on Error") !== -1 ){
				text = text.split("J-Link Commander will now exit on Error")[1];	// everything after this error sentinel
			}
		}else{
			text = text.stderr;
		}

		text = text.trim().split('\n').join(' ');	// single line what's left
		return new JLinkError( text );
	};

	exports.defaultJLinkEXEForPlatform = function(){
		if( process.env[ 'JLINKEXE' ] ){
			return process.env[ 'JLINKEXE' ];
		}

		if( process.platform.indexOf("win") === 0 ){
			return "jlink";
		}else if( process.platform.indexOf('linux') !== -1 ){
			return "JlinkExe";
		} else return "jlinkexe";
	};

	exports.JLinkExe = exports.defaultJLinkEXEForPlatform();

	exports.JLinkExeOptions = "-device nrf51822 -if swd -speed 4000 -autoconnect 1".split(" ");

	exports.setDebug = function( flag ){
		debug = flag;
	};

	exports.executeJlinkCommands = function( commandArray, options ){
		if( options === void 0 ) options = {};
		if( commandArray === void 0 ) commandArray = [];
		if( !options.timeoutSeconds ) options.timeoutSeconds = 30;
		if( options.debug === void 0 ) options.debug = debug;

		if( commandArray.join(" ").indexOf('exitonerror') === -1 ){
			commandArray.unshift('exitonerror 1');
		}

		if( commandArray.indexOf('exit') === -1 ){
			commandArray.push('exit');
		}

		const commandString = commandArray.join("\n");

		if( options.debug ) console.log(`NODE-JLINK: COMMAND LINE: ${exports.JLinkExe} ${exports.JLinkExeOptions.join(' ')}`);

		if( options.debug ) console.log(`NODE-JLINK: JLINK SCRIPT:\n\t${commandArray.join("\n\t")}`);
		if( options.debug ) console.log(`NODE-JLINK: TIMEOUT SECONDS: ${options.timeoutSeconds}`);

		return new Promise( function( resolve, reject ){
			const terminal = spawn( exports.JLinkExe, exports.JLinkExeOptions );

			const result = {
				stdout: "",
				stderr: "",
				code: 0,
				error: null
			};

			let exited = false;

			function exitOnError( error ){
				if( exited ) return;
				exited = true;
				clearTimeout( timeout );
				reject( error );
			}

			function exitOnSuccess( result ){
				if( exited ) return;
				exited = true;
				clearTimeout( timeout );
				resolve( result );
			}

			terminal.stdout.on('data', function (data) {
				if( exited ) return;
				const output = data.toString('utf8');
				result.stdout += output;
				if( options.debug ) console.log( `NODE-JLINK: STDOUT: ${output.trim()}` );
				if( output.indexOf("FAILED") !== -1 ){
					exitOnError( new Error("ERROR: JLINKEXE: " + output ));
				}
			});

			terminal.stderr.on('data', function (data) {
				if( exited ) return;
				const output = data.toString('utf8');
				result.stderr += output;
				if( options.debug ) console.log( `NODE-JLINK: STDERR: ${output.trim()}` );
			});

			terminal.on('exit', function (code) {
				if( exited ) return;
				result.code = code;
				if( options.debug ) console.log(`NODE-JLINK: EXIT CODE: ${code}`);
				if( code === 0 ) return exitOnSuccess( result );
				exitOnError( JLinkError.withExecResult( result) );
			});

			terminal.stdin.write( commandString );
			terminal.stdin.end();

			let timeout = setTimeout( function(){
				if( exited ) return;
				result.error = new Error("executeJlinkCommands: timeout");
				if( options.debug ) console.log(`NODE-JLINK: TIMEDOUT`);
				exitOnError( JLinkError.withExecResult( result) );
			}, options.timeoutSeconds * 1000 );
		});
	};

	exports.parseMemoryStringToBuffer = function( data, address, numBytes ){
		// First find the index of the memory results: "100000A4 = "
		const addressStartMarker = utils.numberToHexString( address, 8) + " = ";
		const dataIndex = data.indexOf( addressStartMarker );
		if( dataIndex === -1 ) throw new Error("parseMemoryStringToBuffer found no memory data");

		// Clip off everything before the marker
		data = data.substring( dataIndex );

		// Parse line by line until a bytes array
		// Example: 100000A4 = 36 0B 7E 3C 54 68 D6 38  F6 FF FF FF 00 50 00 78  6.~.Th.8.....P.x
		// => [0x36, 0x0B, 0x7E, 0x3C, 0x54, 0x68, 0xD6, 0x38, 0xF6, 0xFF, 0xFF, 0xFF, 0x00, 0x50, 0x00, 0x78]
		const memoryRows = data.split(/[\n\r]+/)
		const memoryRegEx = /^([A-F0-9]{8}) = (([A-F0-9]{2}\s{1,2}){1,16})(\s+).{1,16}$/i;

		let bytes = [];
		let rowAddress = address;

		for( let row of memoryRows){
			const matches = memoryRegEx.exec( row );
			if( !matches || matches.length < 5) break;
			const foundAddress = parseInt(matches[1],16)
			if( foundAddress !== rowAddress ) break;
			const foundBytes = matches[2].trim().split(/\s+/).map( b => parseInt(b, 16))
			bytes.push( ...foundBytes)
			rowAddress += foundBytes.length
		}

		if( bytes.length < numBytes ) throw new Error(`Found only ${bytes.length} bytes of requested ${numBytes} bytes`)

		// Copy desired bytes into a buffer
		return Buffer.from( bytes.slice(0, numBytes) );
	};

	exports.parseJLinkVersionInfo = function( data ){

		function extractText( string, pattern ){
			const matches = string.match( pattern );
			if( matches && matches.length >= 2 ) return matches[1];
			return null;
		}

		const dllVersion = extractText( data, "DLL version V(.*)," );
		const serialNumber = extractText( data, "S\/N: (.*)" );
		const firmware = extractText( data, "Firmware: (.*)" );

		const versionInfo = {};
		if( dllVersion ) versionInfo.dllVersion = dllVersion;
		if( serialNumber ) versionInfo.serialNumber = serialNumber;
		if( firmware ) versionInfo.firmware = firmware;

		return versionInfo;
	};

})();
