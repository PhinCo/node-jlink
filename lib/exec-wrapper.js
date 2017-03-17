( function(){
	'use strict';

	var spawn = require('child_process').spawn;
	var Promise = require("bluebird");
	var _ = require("lodash");
	var util = require('util');

	function ExecError( message, command, exitCode, cause ){
		Error.call( this );
		this.command = command;
		this.exitCode = exitCode;
		this.cause = cause;
	}
	util.inherits( ExecError, Error );




	exports.runCommand = function( command, args, options ){

		var defaults = {
			streamStdOut: false,
			streamStdErr: false
		};

		options = _.extend( defaults, options );

		return new Promise( function( resolve, reject ){
			var runningCommand = false;
			try{
				runningCommand = spawn( command, args, options );
			}catch( error ){
				console.error("Exec-Wrapper failed to run command: " + command + ", error:", error );
				reject( error );
			}
			// console.log( "%s %s".blue, command, (args) ? args.join(" ") : "" );
			// console.log( "ARGS", args );

			var stdout = [];
			var stderr = [];

			function _buildResult( code, signal, error ){
				return {
					code: code,
					signal: signal,
					stdout: (stdout) ? stdout.join("\n") : "",
					stderr: (stderr) ? stderr.join("\n") : "",
					error: error
				}
			}

			runningCommand.stdout.on( 'data', function( data ){
				var text = data.toString('utf8');
				stdout.push( text );
				if( options.streamStdOut ) console.log( text.yellow );
			});

			runningCommand.stderr.on( 'data',  function( data ){
				var text = data.toString('utf8');
				stderr.push( text );
				if( options.streamStdErr ) console.log( text.red );
			});

			runningCommand.on( 'exit',  function( code, signal ){
				resolve( _buildResult( code, signal ) );
			});

			runningCommand.on( 'error',  function( error ){
				resolve( _buildResult( -1, -1, error ));
			});

		});
	};

})();