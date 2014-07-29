"use strict";

/* =============================================================================
 * 
 * THIS IS A SCRATCH PAD FOR INITIAL TESTING - IT WILL EVENTUALLY BE REMOVED
 * 
 * However, since it show some examples, I am leaving it in the repo for now.
 *  
 * ========================================================================== */

var Bcp = require('./');

var b = new Bcp({ trusted: true, database: 'Simple', tmp: 'c:\\Temp\\bcp-test', unicode: true, fieldTerminator: '\t:::\t', rowTerminator: '\t:::\n' });

//b.bulkExport('BulkTest', {keepFiles: true, read: true}, function (error, results, details)
//{
//	if (error)
//		console.error(error.stack);
//	else
//	{
//		console.log(results);
//		console.log(details);
//	}
//});

b.prepareBulkInsert('BulkTest', ['oneDate', 'nullDate', 'myInteger', 'myFloat', 'myString', 'myAscii', 'myBit'], function (error, imp)
{
	if (error)
	{
		console.error(error);
		return;
	}
	
	imp.writeRows([
		{ oneDate: new Date(), nullDate: null, myInteger: 8, myFloat: 26.4, myString: 'Hellow', myAscii: 'veeeryone', myBit: true },
		{ oneDate: new Date('2013-01-01'), nullDate: null, myInteger: 7, myFloat: 23.3, myString: 'Seven', myAscii: 'Three', myBit: false },
		{ oneDate: new Date('2013-02-01'), nullDate: new Date('2013-03-01T12:00:00.000Z'), myInteger: 23, myFloat: 6.4, myString: 'One', myAscii: '', myBit: true },
//		{ id: 4, oneDate: new Date('2014-09-01'), nullDate: null, myInteger: 7, myFloat: 8.4, myString: 'this	string with tabs', myAscii: 'This unicode	string ? with tabs', myBit: false },
//		{ id: 1, oneDate: new Date('2014-10-01 12:00:00.000'), nullDate: null, myInteger: 23, myFloat: 23.7, myString: 'This unicode	string ? with tabs', myAscii: 'this	string with tabs', myBit: true },
//		{ id: 5, oneDate: new Date('2014-10-01 12:00:00.000'), nullDate: null, myInteger: 23, myFloat: 23.7, myString: 'This unicode	string ☃ with tabs', myAscii: 'this	string with tabs', myBit: true },
	]);
	
	imp.execute(function (error)
	{
		if (error)
			console.error(error);
		else
			console.log('done');
	});
});
