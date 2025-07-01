// src/js/appConfig.js
define([], function() {
  'use strict';

  const configs = {
    development: {
      backendUrl: 'http://localhost:3000'
    },
    production: {
      backendUrl: ''
    },
    test: {
        backendUrl: ''
    }
  };


  const currentEnv = 'development'; 

  return configs[currentEnv];
});