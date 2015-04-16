# mongodb-js

[![build status](https://secure.travis-ci.org/imlucas/mongodb-js.png)](http://travis-ci.org/imlucas/mongodb-js)

A runtime that turns MongoDB flavored JS into real JS by

- transforming code with [recast](https://github.com/benjamn/recast) and [regenerator](https://github.com/facebook/regenerator)
- providing a pluggable interface for the MongoDB environment

## Example

```javascript
var mongodb_js = require('mongodb-js');

mongodb_js.run("print('hello'); print(db.users.stats();)", 'localhost:27017')
  .on('data', function(data){
    console.log('mongodb sez: ', data);
  })
  .on('error', function(err){
    console.error(err);
  });
```

## How does Javascript in MongoDB work?

Well, it's not really documented anywhere right now, but after a bit of
digging, here's what I've found.  You also might want to read the
[V8 Embedder's Guide](https://developers.google.com/v8/embed) or [node-embed](https://github.com/hoonto/node-embed) as a prerequisite.

Kernel CPP functions are exposed to javascript via V8 scope injection,
primarily through `injectNative()` and `injectV8Method()`.  If you've
written node.js binary addon's in the past, it's pretty much the exact
same thing and you can think of these injection methods as equivalent to
`exports->Set()`.

- environment
- cursor
- mongo
- shell

### environment

[scripting/engine_v8.cpp](https://github.com/mongodb/mongo/blob/master/src/mongo/scripting/engine_v8.cpp)
is a good place to start in looking at all of this.  V8Scope provides
the bindings for all non-standard JS types such as Long, UUID, Hex, etc.

[`print`, `version`, `gc`, and cpu profiling](https://github.com/mongodb/mongo/blob/master/src/mongo/scripting/engine_v8.cpp#L550-L555)

```cpp
injectV8Function("print", Print);
injectV8Function("version", Version);  // TODO: remove
injectV8Function("gc", GCV8);
// injectV8Function("startCpuProfiler", startCpuProfiler);
// injectV8Function("stopCpuProfiler", stopCpuProfiler);
// injectV8Function("getCpuProfile", getCpuProfile);
```

[`load`](https://github.com/mongodb/mongo/blob/master/src/mongo/scripting/engine_v8.cpp#L1259-L1260)
```cpp
// install 'load' helper function
injectV8Function("load", load);
```

[`Mongo` constructor](https://github.com/mongodb/mongo/blob/master/src/mongo/scripting/engine_v8.cpp#L1234)
```cpp
injectV8Function("Mongo", MongoFT(), _global);
```

[constructors for `DB`, `DBQuery`, and `DBCollection`](https://github.com/mongodb/mongo/blob/master/src/mongo/scripting/engine_v8.cpp#L1281-L1283)

```cpp
injectV8Function("DB", DBFT(), _global);
injectV8Function("DBQuery", DBQueryFT(), _global);
injectV8Function("DBCollection", DBCollectionFT(), _global);
```

[bson stuff](https://github.com/mongodb/mongo/blob/master/src/mongo/scripting/engine_v8.cpp#L1291-L1316)
```cpp
_ObjectIdFT  = FTPtr::New(injectV8Function("ObjectId", objectIdInit));
_DBRefFT     = FTPtr::New(injectV8Function("DBRef", dbRefInit));
_DBPointerFT = FTPtr::New(injectV8Function("DBPointer", dbPointerInit));

_BinDataFT    = FTPtr::New(getBinDataFunctionTemplate(this));
_NumberLongFT = FTPtr::New(getNumberLongFunctionTemplate(this));
_NumberIntFT  = FTPtr::New(getNumberIntFunctionTemplate(this));
_TimestampFT  = FTPtr::New(getTimestampFunctionTemplate(this));
_MinKeyFT     = FTPtr::New(getMinKeyFunctionTemplate(this));
_MaxKeyFT     = FTPtr::New(getMaxKeyFunctionTemplate(this));

injectV8Function("BinData", BinDataFT(), _global);
injectV8Function("NumberLong", NumberLongFT(), _global);
injectV8Function("NumberInt", NumberIntFT(), _global);
injectV8Function("Timestamp", TimestampFT(), _global);

// These are instances created from the functions, not the functions themselves
_global->ForceSet(strLitToV8("MinKey"), MinKeyFT()->GetFunction()->NewInstance());
_global->ForceSet(strLitToV8("MaxKey"), MaxKeyFT()->GetFunction()->NewInstance());

// These all create BinData objects so we don't need to hold on to them.
injectV8Function("UUID", uuidInit);
injectV8Function("MD5", md5Init);
injectV8Function("HexData", hexDataInit);

injectV8Function("bsonWoCompare", bsonWoCompare);
```

### cursor

[scripting/v8_db.cpp](https://github.com/mongodb/mongo/blob/master/src/mongo/scripting/v8_db.cpp)
provides all of the hooks for cursors (`getInternalCursorFunctionTemplate`).
A JS cursor instance is exposed to the V8 scope and is powered
directly by a [client/dbclientcursor.cpp](https://github.com/mongodb/mongo/blob/master/src/mongo/client/dbclientcursor.cpp)
instance.

### mongo

[Mongo](https://github.com/mongodb/mongo/blob/master/src/mongo/shell/mongo.js)
is the class that every single operation goes through.  Even every command
boils down to calling find at the end of the day.  Of these seven methods,
only `find` and `cursorFromId` return something actionable.  The rest return
`undefined` except `auth` which returns a boolean.

```cpp
scope->injectV8Method("find", mongoFind, proto);
scope->injectV8Method("insert", mongoInsert, proto);
scope->injectV8Method("remove", mongoRemove, proto);
scope->injectV8Method("update", mongoUpdate, proto);
scope->injectV8Method("auth", mongoAuth, proto);
scope->injectV8Method("logout", mongoLogout, proto);
scope->injectV8Method("cursorFromId", mongoCursorFromId, proto);
```

### shell

Lastly, there are lots of little helper functions injected to allow for
productivity in testing, administration, benchmarking, and ... well just because.


```cpp
# shell_utils_launcher.cpp
scope.injectNative( "_startMongoProgram", StartMongoProgram );
scope.injectNative( "runProgram", RunProgram );
scope.injectNative( "run", RunProgram );
scope.injectNative( "_runMongoProgram", RunMongoProgram );
scope.injectNative( "stopMongod", StopMongoProgram );
scope.injectNative( "stopMongoProgram", StopMongoProgram );
scope.injectNative( "stopMongoProgramByPid", StopMongoProgramByPid );
scope.injectNative( "rawMongoProgramOutput", RawMongoProgramOutput );
scope.injectNative( "clearRawMongoProgramOutput", ClearRawMongoProgramOutput );
scope.injectNative( "waitProgram" , WaitProgram );
scope.injectNative( "checkProgram" , CheckProgram );
scope.injectNative( "resetDbpath", ResetDbpath );
scope.injectNative( "pathExists", PathExists );
scope.injectNative( "copyDbpath", CopyDbpath );

...

[shell/shell_utils.cpp](https://github.com/mongodb/mongo/blob/master/src/mongo/shell/shell_utils.cpp#L218-L228)
```cpp
scope.injectNative( "quit", Quit );
scope.injectNative( "getMemInfo" , JSGetMemInfo );
scope.injectNative( "_replMonitorStats" , replMonitorStats );
scope.injectNative( "_srand" , JSSrand );
scope.injectNative( "_rand" , JSRand );
scope.injectNative( "_isWindows" , isWindows );
scope.injectNative( "interpreterVersion", interpreterVersion );
scope.injectNative( "getBuildInfo", getBuildInfo );
scope.injectNative( "isKeyTooLarge", isKeyTooLarge );
scope.injectNative( "validateIndexKey", validateIndexKey );
```

[shell/shell_utils.cpp](https://github.com/mongodb/mongo/blob/master/src/mongo/shell/shell_utils.cpp#L239-L240)
```cpp
scope.injectNative("_useWriteCommandsDefault", useWriteCommandsDefault);
scope.injectNative("_writeMode", writeMode);
```

[shell/shell_utils.cpp](https://github.com/mongodb/mongo/blob/master/src/mongo/shell/shell_utils.cpp#L250-L253)

```cpp
injectNative("benchRun", BenchRunner::benchRunSync);
injectNative("benchRunSync", BenchRunner::benchRunSync);
injectNative("benchStart", BenchRunner::benchStart);
injectNative("benchFinish", BenchRunner::benchFinish);
```

[shell/shell_utils_extended.cpp](https://github.com/mongodb/mongo/blob/master/src/mongo/shell/shell_utils_extended.cpp#L244-L254)

```cpp
scope.injectNative( "getHostName" , getHostName );
scope.injectNative( "removeFile" , removeFile );
scope.injectNative( "fuzzFile" , fuzzFile );
scope.injectNative( "listFiles" , listFiles );
scope.injectNative( "ls" , ls );
scope.injectNative( "pwd", pwd );
scope.injectNative( "cd", cd );
scope.injectNative( "cat", cat );
scope.injectNative( "hostname", hostname);
scope.injectNative( "md5sumFile", md5sumFile );
scope.injectNative( "mkdir" , mkdir );
```

### bonus: mapreduce

[db/commands/mr.cpp](https://github.com/mongodb/mongo/blob/master/src/mongo/db/commands/mr.cpp)

```cpp
_scope->injectNative("_bailFromJS", _bailFromJS, this);
_scope->injectNative( "emit" , fast_emit, this );
_scope->injectNative("_nativeToTemp", _nativeToTemp, this);
```

### double bonus: scripting utils

[scripting/utils.cpp](https://github.com/mongodb/mongo/blob/master/src/mongo/scripting/utils.cpp)

```cpp
scope.injectNative( "hex_md5" , native_hex_md5 );
scope.injectNative( "version" , native_version );
scope.injectNative( "sleep" , native_sleep );
```

## Notes

These are async and need to be rewritten to `{decl} = function *(`

- DB.prototype.runCommand
- DB.prototype.adminCommand
- DB.prototype._dbCommand
- DB.prototype._adminCommand

Any methods that call the above need the `function *(` rewrite, as well as a `yield` inserted before the function call like so:

```javascript
var res = yield db.runCommand({...});
```

- ` == ` -> ` === `
- ` != ` -> ` !== `
- `this._dbCommand` -> ` yield this._dbCommand`
- `this.runCommand` -> ` yield this.runCommand`
- `this._db.runCommand` -> ` yield this._db.runCommand`

Making all of the string replacements to add yields and then running
jshint will raise an error

## Todo

- [x] lots and lots of POC's to figure out how this could work
- [x] how gnarly is the kernel source? (pretty rough, but doable)
- [x] can the actual backend be stubbed in place? (yep see poc.js)
- [x] will generators actually work? (yep see poc.js)
- [x] `dbclientcursor` in js
- [x] `mongo` methods in js
- [x] manually transform lib js to work with async & commonjs
- [x] provide mongo context to vm
- [x] provide stub shell utils context to vm
- [ ] auto transform -> commonjs script
- [ ] auto transform -> add `*`'s and yields
- [ ] `db.<collection>` access: go with [noSuchmethod][noSuchMethod] or rewrite rule that transforms into `db.getCollection('<collection>')`

[noSuchMethod]: http://wiki.ecmascript.org/doku.php?id=harmony%3aproxies#simulating_nosuchmethod_doesnotunderstand
