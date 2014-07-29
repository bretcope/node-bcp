"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var Athena = require('odyssey').athena;
var debug = require('neo-debug')('bcp:');
var Fs = require('fs');

/* =============================================================================
 * 
 * Class_OR_Section_Name
 *  
 * ========================================================================== */

var UTF16_BOM = new Buffer(2);
UTF16_BOM.writeUInt16BE(0xfffe);

var NUL = String.fromCharCode(0);

module.exports = ImportFile;

/**
 * @param bcp {Bcp}
 * @param format {FormatFile}
 * @param table {string}
 * @param filename {string}
 * @param encoding {string}
 * @constructor
 */
function ImportFile (bcp, format, table, filename, encoding)
{
	/* -------------------------------------------------------------------
	 * Private Members Declaration << no methods >>
	 * ---------------------------------------------------------------- */

	this.bcp = bcp;
	this.format = format;
	this.table = table;
	this.filename = filename;
	this.encoding = encoding;
	this.writeStream = Fs.createWriteStream(filename);
	this.endedError = false;
	
	if (encoding === 'ucs2')
		this.writeStream.write(UTF16_BOM);
}

/* -------------------------------------------------------------------
 * Public Members Declaration << no methods >>
 * ---------------------------------------------------------------- */

// code

/* -------------------------------------------------------------------
 * Public Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

ImportFile.prototype.cancel = function (callback)
{
	var _this = this;
	this.save(function ()
	{
		// try to delete the file regardless of write error (we're canceling, so who cares?)
		Fs.unlink(_this.filename, callback);
	});
};

ImportFile.prototype.execute = function (options, callback)
{
	if (typeof options === 'function')
	{
		callback = options;
		options = null;
	}
	
	var _this = this;
	this.save(function (error)
	{
		if (error)
		{
			callback(error);
			return;
		}
		
		_this.bcp.bulkInsert(_this.filename, _this.format, _this.table, options, callback);
	});
};

ImportFile.prototype.save = function (callback)
{
	if (this.endedError !== false)
	{
		setImmediate(callback, this.endedError);
		return;
	}
	
	var _this = this;
	this.writeStream.end(function (error)
	{
		_this.endedError = error;
		callback(error);
	});
};

ImportFile.prototype.writeRows = function (rows)
{
	var data = '';
	/** @type {Field[]} */
	var fields = this.format.fields;
	var fi, f;
	var fLen = fields.length;
	for (var i = 0; i < rows.length; i++)
	{
		for (fi = 0; fi < fLen; fi++)
		{
			f = fields[fi];
			if (f.inImport)
				data += fieldSerialize(rows[i][f.name], f);
			
			data +=  f.terminator;
		}
	}
	
	debug(data);
	this.writeStream.write(data, this.encoding);
};

/* -------------------------------------------------------------------
 * Private Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

/**
 *
 * @param value {*}
 * @param field {Field}
 */
function fieldSerialize (value, field)
{
	var val;
	if (value === null || value === undefined)
		return '';
	
	if (value === '')
		return NUL;
	
	else if (field.type === 'SQLBIT')
	{
		val = value ? '1' : '0';
	}
	else if (value instanceof Date)
	{
		val = value.toISOString();
		val = val.substr(0, 10) + ' ' + val.substr(11, 12);
	}
	else
	{
		val = String(value);
	}
	
	if (field.maxLength && val.length > field.maxLength)
		val = val.substr(0, field.maxLength);

	return val;
}
