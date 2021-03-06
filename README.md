# node-bcp

A node.js wrapper for the SQL Server [bcp utility](http://msdn.microsoft.com/en-us/library/ms162802.aspx) which allows for bulk insert and export operations.

## Install

    npm install bcp

You will need the `bcp` utility installed on your system. If you're running on Windows and use SQL Server, you probably already have this. On Linux, you can use [Microsoft's ODBC Driver for Linux](http://www.microsoft.com/en-us/download/details.aspx?id=28160) which comes includes the bcp utility. On OSX, sorry, better luck next time.

> This library does not support FreeTDS's reimplementation called `freebcp`. Their implementation is very incomplete and differs enough from the Microsoft version 

## Bulk Import Example

Imagine we have this table:

`MyDatabase.dbo.MyTable`

Column   | Type
-------- | ----
Id       | Int Identity
MyDate   | DateTime
MyFloat  | Float
MyString | NVarChar(50)

```js
var Bcp = require('bcp');

// Initialize a Bcp object with settings like connection info, database, encoding, etc.
var b = new Bcp({
  user: 'login_name',
  password: 'password',
  database: 'MyDatabase',
  fieldTerminator: '\t::\t', // make sure to pick a character sequence not found in your data
  rowTerminator: '\t::\n',
  unicode: true,
  checkConstraints: true
});

// now, prepare a bulk insert. Notice how we excluded the Id column because it's an identity 
// and it would be ignored anyway, unless we set useIdentity: true. All columns in the table, 
// but not listed in the column list here will be inserted as NULL
// The column names do not need to match the same casing as the SQL Server columns, but they 
// must match the properties of the objects passed to writeRows(). Column order is insignificant.
b.prepareBulkInsert('MyTable', ['myDate', 'myFloat', 'myString'], function (err, imp) {
  if (err)
    // ...
  
  // the imp object is an ImportFile object which you can write to
  imp.writeRows([
    { myDate: new Date(), myFloat: 23.7, myString: 'hello' },
    { myDate: new Date('2014-09-01'), myFloat: 7.23, myString: 'world' }
  ]);
  
  // you can call writeRows() as many times as you'd like. It writes to a file stream.
  
  // if you decide you don't want to use this bulk insert, call cancel in order to delete 
  // temporary the data file
  // imp.cancel();
  
  // when you're done writing rows, execute the bulk insert
  imp.execute(function (error)
  {
    if (error)
      // ...
  });
});
```

## Bulk Export Example

```js
var b = new Bcp({
  user: 'login_name',
  password: 'password',
  database: 'MyDatabase',
  checkConstraints: false,
  unicode: false,
  native: true // if need native data format.
});

var customOptions = {
  read: false,
  keepFiles: true,
  sql: 'select * from MyDatabase.dbo.MyTable where id = 1' // if need select query, do like this.
};

b.bulkExport(tablename, customOptions, function (err) {

});
```


> For a full description of all of the options which can be passed to the Bcp constructor, see [lib/Bcp.js](https://github.com/bretcope/node-bcp/blob/master/lib/Bcp.js) and Microsoft's [bcp documentation](http://msdn.microsoft.com/en-us/library/ms162802.aspx).

## Other Notes

This library is incomplete, and not very well tested. It needs lots more documentation, features, better error reporting, and love. Bulk Export is partially implemented, but there are no examples yet. Use at your own risk. May cause drowsiness and irritability.
