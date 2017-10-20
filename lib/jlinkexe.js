( function(){

	// JlinkEXE Interfaces
	// Documentation Source: https://www.segger.com/admin/uploads/productDocs/UM08001_JLink.pdf

	var Promise = require("bluebird");
	var spawn = require('child_process').spawn;
	var utils = require('./utils');

	function JLinkError( message ){
		this.constructor.prototype.__proto__ = Error.prototype; // Make this an instanceof Error.
		Error.call(this); // Does not seem necessary. Perhaps remove this line?
		Error.captureStackTrace(this, this.constructor); // Creates the this.stack getter
		this.name = this.constructor.name; // Used to cause messages like "UserError: message" instead of the default "Error: message"
		this.message = message; // Used to set the message
	}

	/*
	 ERROR:  {
	 stdout: 'SEGGER J-Link Commander V5.10n (Compiled Feb 19 2016 18:41:48)\n
	 DLL version V5.10n, compiled Feb 19 2016 18:41:43\n\n
	 Connecting to J-Link via USB...O.K.\n
	 Firmware: J-Link OB-SAM3U128-V2-NordicSemi compiled Feb 12 2016 12:15:53\n
	 Hardware version: V1.00\nS/N: 681501598\nEmulator has Trace capability\n\
	 VTref = 3.300V\n\n\n
	 Type "connect" to establish a target connection, \'?\' for help\n
	 J-Link Commander will now exit on Error\n
	 Target connection not established yet but required for command.\n
	 Device "NRF51822_XXAA" selected.\n\n\nCan not connect to target.\n
	 Could not read memory.\n',
	 stderr: '',
	 code: 1,
	 error: null }

	 */
	JLinkError.withExecResult = function( execResult ){
		if( !execResult ) return new JLinkError( "JLink command failed" );
		var text = execResult.stdout;
		if( text && text.length > 0 ){
			if( text.indexOf("J-Link Commander will now exit on Error") !== -1 ){
				text = text.split("J-Link Commander will now exit on Error")[1];	// everything after this error sentinel
			}
		}else{
			text = text.stderr;
		}

		text = text.trim().split('\n').join(' ');	// single line what's left
		var error = new JLinkError( text );
		return error;
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

	exports.JLinkExeOptions = "-device nrf51822 -if swd -speed 4000".split(" ");

	exports.executeJlinkCommands = function( commandArray, timeoutSeconds ){
		if( commandArray === void 0 ) commandArray = [];
		if( !timeoutSeconds ) timeoutSeconds = 30;

		if( commandArray.indexOf('exitonerror') === -1 ){
			commandArray.splice(0,1,'exitonerror');
		}

		if( commandArray.indexOf('exit') === -1 ){
			commandArray.push('exit');
		}

		var commandString = commandArray.join("\n");

		return new Promise( function( resolve, reject ){
			var terminal = spawn( exports.JLinkExe, exports.JLinkExeOptions );

			var result = {
				stdout: "",
				stderr: "",
				code: 0,
				error: null
			};

			terminal.stdout.on('data', function (data) {
				var output = data.toString('utf8');
				result.stdout += output;
				//console.log('stdout: ' + output.trim() );
				if( output.indexOf("FAILED") !== -1 ){
					clearTimeout( timeout );
					reject( new Error("executeJlinkCommands: command failed: " + output.trim() ));
				}
			});

			terminal.stderr.on('data', function (data) {
				var output = data.toString('utf8').trim();
				result.stderr += output;
				console.error('executeJlinkCommands: ' + output.trim());
			});

			terminal.on('exit', function (code) {
				result.code = code;
				//console.log('child process exited with code ' + code);
				clearTimeout( timeout );
				if( code === 0 ) resolve( result );
				else reject( JLinkError.withExecResult( result));
			});

			terminal.stdin.write( commandString );
			terminal.stdin.end();

			var timeout = setTimeout( function(){
				result.error = new Error("executeJlinkCommands: timeout");
				reject( result );
			}, timeoutSeconds * 1000 );
		});
	};

	exports.parseMemoryStringToBuffer = function( data, address, numBytes ){
		var addressStartMarker = "\n" + utils.numberToHexString( address, 8) + " = ";
		var dataIndex = data.indexOf( addressStartMarker );
		if( dataIndex === -1 ) throw new Error("_parseMemoryStringToBuffer found no memory data");

		data = data.substring( dataIndex );
		data = data.split("\n");

		var buf = new Buffer( numBytes );
		var uint8Value,
			bytes,
			bufOffset = 0;
		var i, j, k;

		for( i=0; i < data.length; i++ ){
			bytes = data[i].trim().split(" ").slice(2);
			for( j=0; j < bytes.length; j++ ){
				uint8Value = parseInt( bytes[j], 16 );
				buf.writeUInt8( uint8Value, bufOffset );
				bufOffset++;
			}
		}

		return buf;
	};

})();
