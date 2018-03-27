# cppdepsystem
This is my small repository for managing cpp dependencies. This is work in progress



## cmake configuration

```cmake
set(DEPSLIST tpcommon catch fakeit)
foreach(dep ${DEPSLIST})
    include_directories("${CMAKE_BINARY_DIR}/.cppdeps/${dep}/include")
    link_directories("${CMAKE_BINARY_DIR}/.cppdeps/${dep}/lib")
endforeach()

add_custom_target(
  getdeps.js
  COMMAND wget -qO "${CMAKE_BINARY_DIR}/getdeps.js" https://raw.githubusercontent.com/pantadeusz/cppdepsystem/master/getdeps.js
)
add_custom_target(
  getdeps.json
  COMMAND cp "${PROJECT_SOURCE_DIR}/getdeps.json" "${CMAKE_BINARY_DIR}/getdeps.json"
)
add_custom_target(
    cppdeps
    COMMAND node ${CMAKE_BINARY_DIR}/getdeps.js "${CMAKE_BINARY_DIR}/.cppdeps" 
    DEPENDS getdeps.js getdeps.json
)
```

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
