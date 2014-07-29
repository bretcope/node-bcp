"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var Field = require('./Field');
var Fs = require('fs');
var Xml2Js = require('xml2js');

/* =============================================================================
 * 
 * FormatFile - Abstracts interactions with non-xml bcp format files.
 *  
 * ========================================================================== */

module.exports = FormatFile;

function FormatFile (filename, xmlObj)
{
	/* -------------------------------------------------------------------
	 * Public Members Declaration << no methods >>
	 * ---------------------------------------------------------------- */
	
 	this.filename = filename;
	this.xmlOptions = { xmldec: { encoding: null, standalone: null } };
	this.root = 'BCPFORMAT';
	this.rootAttributes = {
		xmlns: 'http://schemas.microsoft.com/sqlserver/2004/bulkload/format',
		'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance'
	};

	this.encoding = 'ascii';
	this.fields = [];
	
	var fields = xmlObj.BCPFORMAT.RECORD[0].FIELD.map(function (o) { return o.$; });
	var columns = xmlObj.BCPFORMAT.ROW[0].COLUMN.map(function (o) { return o.$; });
	for (var i = 0; i < fields.length; i++)
	{
		this.fields.push(new Field(fields[i], columns));
	}
	
	if (fields[0] && fields[0]['xsi:type'] === 'NCharTerm')
		this.encoding = 'ucs2';
}

/* -------------------------------------------------------------------
 * Public Static Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

FormatFile.fromFile = function (filename, callback)
{
	Fs.readFile(filename, { encoding: 'ucs2' }, function (error, xml)
	{
		if (error)
		{
			callback(error);
			return;
		}

		Xml2Js.parseString(xml, function (error, xmlObject)
		{
			if (error)
				callback(error);
			else
				callback(null, new FormatFile(filename, xmlObject));
		});
	});
};

/* -------------------------------------------------------------------
 * Public Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

// code

/* -------------------------------------------------------------------
 * Private Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

// code

