# mongodb-js

[![build status](https://secure.travis-ci.org/imlucas/mongodb-js.png)](http://travis-ci.org/imlucas/mongodb-js)

## todo

- [x] how gnarly is the kernel source? (pretty rough, but doable)
- [x] can the actual backend be stubbed in place? (yep see poc.js)
- [x] will generators actually work? (yep see poc.js)
- [ ] mutate kernel source on the fly to commonjs
- [ ] mutate kernel source on the fly to add generators and yields where needed
- [ ] helper module -> adds yields where needed automatically when parsing shell input
- [ ] track down and provide hooks for ALL random stuff (see shell_util*.cpp below)
- [ ] mongoscope shell uses this + stubbed backend pointing to mongoscope's rest api


## hooks to add for random stuff

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
```

```cpp
# shell_utils.cpp
void installShellUtils( Scope& scope ) {
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

#ifndef MONGO_SAFE_SHELL
    //can't launch programs
    installShellUtilsLauncher( scope );
    installShellUtilsExtended( scope );
#endif
}
```

```cpp
# shell_utils_extended.cpp
void installShellUtilsExtended( Scope& scope ) {
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
}
```
