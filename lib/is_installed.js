( function(){

	const exec = require('./exec-wrapper');

	module.exports = function( filename ){
		let command;

		if( process.platform.indexOf("win") === 0 ){
			command = 'where';
		}else{
			command = 'which';
		}

		return exec.runCommand( command, [ filename ] )
			.then( result => {
				return( result.code === 0 );
			})
	}
})();
