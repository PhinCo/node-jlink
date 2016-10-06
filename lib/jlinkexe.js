( function(){

	// JlinkEXE Interfaces
	// Documentation Source: https://www.segger.com/admin/uploads/productDocs/UM08001_JLink.pdf

	var Promise = require("bluebird");
	var spawn = require('child_process').spawn;
	var utils = require('./utils');

	exports.JLinkExe = "JLinkExe";
	exports.JLinkExeOptions = "-device nrf51822 -if swd -speed 4000".split(" ");

	exports.executeJlinkCommands = function( commandArray, timeoutSeconds ){
		if( !commandArray ) throw new Error( "jlink commmand requires commandArray" );
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
				else reject( result );
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