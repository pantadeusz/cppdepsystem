const {execSync} = require('child_process');
var fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const https = require('https');



execSync(`mkdir -p ${os.homedir()}/.cppdep/__builds__`);

let commonActions = {
  "libdir": function(e) { return `${os.homedir()}/.cppdep/${e.name}_${e.version}`; },
  "builddir": function(e) {
    return `${os.homedir()}/.cppdep/__builds__/${e.name}_${e.version}`;
  },
  "rebuild": function(e) {
    let rebuildCommand =
        `cd ${commonActions.builddir(e)}; mkdir -p build; cd build; cmake -DCMAKE_INSTALL_PREFIX:PATH=${commonActions.libdir(e)} .. && make all install`;
    execSync(rebuildCommand);
    commonActions.errorlog(`built ${e.name} in ${commonActions.libdir(e)}`);
  },
  "errorlog": function(msg, err, stdout, stderr) {
    if (err) {
      console.log(`stdout(${msg}): ${stdout}`);
      console.log(`stderr(${msg}): ${stderr}`);
    } else {
      console.log(`Done: ${msg}`);
    }
  }
}

let engines = {
  "hg": {
    "clone": function(e) {
      let cloneCommand =
          `${e.repo} clone ${e.url} ${commonActions.builddir(e)}`;
      try {
        let result = execSync(cloneCommand);
        commonActions.rebuild(e);
      } catch (err) {
        commonActions.errorlog(`clone ${e.name}`, err);
      }
    },
    "update": function(e) {
      let updateCommand = `cd ${commonActions.builddir(e)}; ${e.repo} pull -u`;
      try {
        execSync(updateCommand);
        commonActions.rebuild(e);
      } catch (err) {
        commonActions.errorlog(`clone ${e.name}`, err);
      }
    }
  },
  "git": {
    "clone": function(e) {
      try {
        execSync(`${e.repo} clone ${e.url} ${commonActions.builddir(e)}; `);
        commonActions.rebuild(e);
      } catch (err) {
        commonActions.errorlog(`clone ${e.name}`, err);
      }
    },

    "update": function(e) {
      execSync(`cd ${commonActions.builddir(e)}; git pull`);
      try {
        commonActions.rebuild(e);
      } catch (err) {
        commonActions.errorlog(`update ${e.name}`, err);
      }
    }
  },
  "wget": {
    "clone": function(e) {
      try {
        execSync(
            `mkdir -p ${commonActions.builddir(e)} && wget -O ${commonActions.builddir(e)}/${e.name}.tar.bz2 ${e.url}`);
        execSync(
            `mkdir -p ${commonActions.libdir(e)} && cd ${commonActions.libdir(e)} && tar -xvf ${commonActions.builddir(e)}/${e.name}.tar.bz2`);
        commonActions.errorlog(
            `unpacked ${e.name} in ${commonActions.libdir(e)}`);
      } catch (err) {
        commonActions.errorlog(`clone ${e.name}`, err);
      }
    },
    "update": function(e) {
      commonActions.errorlog(
          `update ${e.name} - it was already downloaded - doing nothing`);
    }
  }
};


let dependencyList =
    JSON.parse(fs.readFileSync(process.argv[1] + "on", 'utf8')).depends;

let getRepositoriesList = function(callback) {
  https
      .get(
          'https://raw.githubusercontent.com/pantadeusz/cppdepsystem/master/cpprepository.json',
          function(res) {
            var body = '';
            res.on('data', function(chunk) { body += chunk; });
            res.on('end', function() { callback(JSON.parse(body)); });
          })
      .on('error', function(e) { callback(undefined); });
};

if (process.argv[2] === '--help') {
  console.log(`getdeps for c++ by Tadeusz Puźniakowski
  
You can add to your cmake file the following text:
  
set(DEPSLIST tpcommon catch fakeit)
foreach(dep \${DEPSLIST})
    include_directories("\${CMAKE_BINARY_DIR}/.cppdeps/\${dep}/include")
    link_directories("\${CMAKE_BINARY_DIR}/.cppdeps/\${dep}/lib")
endforeach()

add_custom_target(
  getdeps.js
  COMMAND wget -qO "\${CMAKE_BINARY_DIR}/getdeps.js" https://raw.githubusercontent.com/pantadeusz/cppdepsystem/master/getdeps.js
)
add_custom_target(
  getdeps.json
  COMMAND cp "\${PROJECT_SOURCE_DIR}/getdeps.json" "\${CMAKE_BINARY_DIR}/getdeps.json"
)
add_custom_target(
    cppdeps
    COMMAND node \${CMAKE_BINARY_DIR}/getdeps.js "\${CMAKE_BINARY_DIR}/.cppdeps" 
    DEPENDS getdeps.js getdeps.json
)
`);
} else if (process.argv[2] === '--list') {
  getRepositoriesList(function(reposJson) {
    reposJson.packages.forEach(function(e) {
      dependencyList.forEach(function(dependency) {
        if ((dependency.name === e.name) && (dependency.version == e.version)) {
          console.log(dependency.name);
        }
      });
    });
  });
} else {
  getRepositoriesList(function(reposJson) {
    if (reposJson) {
      let lockdigest = crypto.createHash('md5')
                           .update(process.argv[0] + ":" + process.argv[1])
                           .digest("hex");
      if (fs.existsSync(`/tmp/getdep.${lockdigest}.lock`)) {
        console.log(
            `the getdep process already running!!: /tmp/getdep.${lockdigest}.lock`);
      } else {
        console.log("started job for " + lockdigest);
        execSync(`touch /tmp/getdep.${lockdigest}.lock`);
        // JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
        reposJson.packages.forEach(function(e) {
          dependencyList.forEach(function(dependency) {
            if ((dependency.name === e.name) &&
                (dependency.version == e.version)) {
              if (fs.existsSync(`${commonActions.builddir(e)}`)) {
                engines[e.repo].update(e);
              } else {
                engines[e.repo].clone(e);
              }
              // katalog docelowy dla builda

              try {
                console.log(`${process.argv[2]}/${e.name}`);
                fs.readlinkSync(`${process.argv[2]}/${e.name}`);
              } catch (exc) {
                console.log(`mkdir -p ${process.argv[2]}`);
                execSync(`mkdir -p ${process.argv[2]}`);
                console.log(
                    `ln -s ${commonActions.libdir(e)} ${process.argv[2]}/${e.name}`);
                execSync(
                    `ln -s ${commonActions.libdir(e)} ${process.argv[2]}/${e.name}`);
              }
            }
          });
        });
        execSync(`rm -f /tmp/getdep.${lockdigest}.lock`);
      }
      console.log("finished building deps");
    }
  });
}