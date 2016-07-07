"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

//

/* =============================================================================
 *
 * Field Class - Represents a field in a format file.
 *
 * ========================================================================== */

var NUL = String.fromCharCode(0);

module.exports = Field;

function Field (fieldObj, columns)
{
	/* -------------------------------------------------------------------
	 * Public Members Declaration << no methods >>
	 * ---------------------------------------------------------------- */

	var id = fieldObj.ID;
	this.name = '';
	this.type = null;
	this.inImport = false;
	this.maxLength = fieldObj.MAX_LENGTH ? Number(fieldObj.MAX_LENGTH) : null;
	if (fieldObj.TERMINATOR !== undefined) {
	this.terminator = decodeTerminator(fieldObj.TERMINATOR, fieldObj['xsi:type'] === 'NCharTerm');
	}
	this.attributes = fieldObj;
	this.column = null;

	for (var i = 0; i < columns.length; i++)
	{
		if (columns[i].SOURCE === id)
		{
			this.column = columns[i];
			this.name = this.column.NAME;
			this.type = this.column['xsi:type'];
			break;
		}
	}
}

/* -------------------------------------------------------------------
 * Public Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

Field.prototype.setSourceIndex = function (index)
{
	var id = String(index + 1);
	this.attributes.ID = id;
	if (this.column)
		this.column.SOURCE = id;
};

/* -------------------------------------------------------------------
 * Private Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

function decodeTerminator (term, wide)
{
	// jump through some hoops to decode the terminator properly
	term = term.replace(/(\\+)([^\\]?)/g, function (match, slashes, char)
	{
		// even number of slashes means they were only escaping themselves.
		if (slashes.length % 2 === 0)
			return slashes.substr(0, slashes.length / 2) + char;

		slashes = slashes.length > 1 ? slashes.substr(0, (slashes.length / 2) | 0) : '';

		// turn escape sequence into a normal character
		if (char === '0')
			char = NUL;
		else
			char = JSON.parse('"\\' + char + '"');

		return slashes + char;
	});

	if (wide)
	{
		// convert from ascii-encoded utf16 into utf8
		term = new Buffer(term, 'ascii').toString('ucs2');
	}

	return term;
}
