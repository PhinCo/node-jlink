( function(){

	'use strict';

	exports.numberToHexString = function(d, padding ){
		var hex = Number(d).toString(16).toUpperCase();
		padding = typeof (padding) === "undefined" || padding === null ? padding = 8 : padding;

		while (hex.length < padding) {
			hex = "0" + hex;
		}

		return hex;
	};

	exports.numberToHexStringLittleEndian = function( d, padding ){
		if( padding % 2 != 0 ) throw new Error("numberToHexStringLittleEndian requires an even padding [" + padding + "]");

		var bigEndianHex = exports.numberToHexString( d, padding );

		var littleEndianHex = "";
		while( bigEndianHex.length ){
			var nibble = bigEndianHex[0] + bigEndianHex[1];
			bigEndianHex = bigEndianHex.slice(2);
			littleEndianHex = nibble + littleEndianHex;
		}

		return littleEndianHex;
	};

	exports.hexToDecimal = function( hexString ){
		try{
			return parseInt( hexString, 16 );
		}catch( e ){
			console.error( "Error parsing hexString: ", e );
			return 0;
		}
	};

})();