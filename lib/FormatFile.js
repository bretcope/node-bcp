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

function FormatFile (filename, isXml, obj)
{
 	this.filename = filename;

	if (isXml)
		this.fromXml(obj)
	else
		this.fromNonXml(obj);
}

FormatFile.prototype.fromXml = function(xmlObj)
{
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

FormatFile.prototype.fromNonXml = function(formatObj)
{
	this.encoding = 'ascii';
	this.fields = [];

	for (var i = 0; i < formatObj.fields.length; i++)
	{
		this.fields.push(new Field(formatObj.fields[i], formatObj.columns));
	}
}

/* -------------------------------------------------------------------
 * Public Static Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

FormatFile.fromFile = function (filename, useXml, callback)
{
	Fs.readFile(filename, { encoding: useXml ? 'ucs2' : 'ascii' }, function (error, data)
	{
		if (error)
		{
			callback(error);
			return;
		}
		if (useXml)
		{
			Xml2Js.parseString(data, function (error, xmlObject)
			{
				if (error)
					callback(error);
				else
					callback(null, new FormatFile(filename, true, xmlObject));
			});
		}
		else
		{
			var formatObj = parseNonXmlFormatFile(data);

			if (formatObj.error)
				callback(formatObj.error);
			else
				callback(null, new FormatFile(filename, false, formatObj));

		}
	});
};

/* -------------------------------------------------------------------
 * Public Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

// code

/* -------------------------------------------------------------------
 * Private Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

function decodeTerminator(t)
{
	return t.replace(/^"(.*)"$/, "$1") // remove double quotes
			.replace(/(.)\\0/g, "$1"); // remove ucs2 \0
}

function parseNonXmlFormatFile(data)
{
	var formatObj = { columns: [], fields: [] };

	function invalid(msg)
	{
		return { error: 'Cannot parse non-XML file: ' + msg };
	}

	var lines = data.split("\n");

	if (lines.length <= 2)
		return invalid('File must contain at least 2 lines');

	var numColumns = parseInt(lines[1]);

	if (isNaN(numColumns))
		return invalid('Cannot read the number of columns');

	for (var i = 2; i < 2 + numColumns; ++i)
	{
		var parts = lines[i].split(" ");

		if (parts.length <= 8)
			return invalid('Cannot read format line: not enough columns (line ' + (i + 1) + ')');

		parts = parts.filter(function(txt) { return txt !== ""; });

		var field = {};

		field['MAX_LENGTH'] = parseInt(parts[3]);
		field['TERMINATOR'] = decodeTerminator(parts[4]);
		field['xsi:type'] = parts[1];
		field['ID'] = parseInt(parts[0]);
		// prefix length unused

		if (isNaN(field['MAX_LENGTH']) || isNaN(field['ID']))
			return invalid('Cannot field column on line ' + (i + 1) + ': integer value expected');

		var column = { }

		column['SOURCE'] = parseInt(parts[5]);
		column['NAME'] = parts[6];
		column['xsi:type'] = parts[7];

		if (isNaN(column['SOURCE']))
			return invalid('Cannot read column on line ' + (i + 1) + ': integer value expected');

		formatObj.fields.push(field);
		formatObj.columns.push(column);
	}

	return formatObj;
}
