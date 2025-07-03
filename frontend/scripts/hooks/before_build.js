/**
  Copyright (c) 2015, 2025, Oracle and/or its affiliates.
  Licensed under The Universal Permissive License (UPL), Version 1.0
  as shown at https://oss.oracle.com/licenses/upl/

*/

'use strict';

module.exports = function (configObj) {
  return new Promise((resolve, reject) => {
  	console.log("Running before_build hook.");
  	
  	// Copy oraclejetconfig.json to web directory for runtime access
    const fs = require('fs');
    const path = require('path');
    
    try {
      const srcPath = path.resolve('oraclejetconfig.json');
      const destPath = path.resolve('web/oraclejetconfig.json');
      fs.copyFileSync(srcPath, destPath);
      console.log('Copied oraclejetconfig.json to web directory');
    } catch (error) {
      console.warn('Could not copy oraclejetconfig.json:', error.message);
    }
    
  	resolve(configObj);
  });
};
