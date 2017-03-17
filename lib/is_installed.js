( function(){

	var exec = require('./exec-wrapper');
	var Promise = require("bluebird");

	module.exports = function( filename ){
		var command;

		if( process.platform.indexOf("win") === 0 ){
			command = 'where';
		}else{
			command = 'which';
		}

		return exec.runCommand( command, [ filename ] )
			.then( function( result ){
				return( result.code === 0 );
			});
	}
})();