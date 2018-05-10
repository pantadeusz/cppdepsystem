# cppdepsystem

This is my small repository for managing cpp dependencies. This is work in progress. If you wish to contribute, then feel free to open pull request. I cannot promis that this will be resolved quickly (my other projects).

Currently tere are mosly my own dependencies and projects, some of them are currently closed source (sorry), but the engine for cpp dependency management is here for free.

## Dependencies

cppdepsystem neads recent version of NodeJS that can be obtained here: [https://nodejs.org/en/](https://nodejs.org/en/)


## cmake configuration

Just add this in your cmake configuration file

```cmake
execute_process( COMMAND wget -qO "${CMAKE_BINARY_DIR}/getdeps.js" "https://raw.githubusercontent.com/pantadeusz/cppdepsystem/master/getdeps.js" )
execute_process( COMMAND cp "${PROJECT_SOURCE_DIR}/getdeps.json" "${CMAKE_BINARY_DIR}/getdeps.json" )
execute_process( COMMAND node "${CMAKE_BINARY_DIR}/getdeps.js" "--list"
    OUTPUT_VARIABLE DEPSLIST
)
string(REGEX REPLACE "\n$" "" DEPSLIST "${DEPSLIST}")
foreach(dep ${DEPSLIST})
    include_directories("${CMAKE_BINARY_DIR}/.cppdeps/${dep}/include")
    link_directories("${CMAKE_BINARY_DIR}/.cppdeps/${dep}/lib")
endforeach()
add_custom_target( cppdeps
    COMMAND node ${CMAKE_BINARY_DIR}/getdeps.js "${CMAKE_BINARY_DIR}/.cppdeps" 
)
```

and depend on _cppdeps_.

## json config

place getdeps.json in your project's root dir. The example:

```json
{
    "depends":[
        {"name":"catch", "version":"1.10"},
        {"name":"fakeit","version":"2017.05.07"}
    ]
}
```
