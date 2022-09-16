/**
 * Configurations of logger.
 */
const winston = require('winston');
const { format } = require('winston')
const fs = require('fs');
var util = require('util');

const logDir = '../../../pdalog';
// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}


const infoLogger = new (winston.createLogger)({
  format: format.combine(
     format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
  }),
  format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`+(info.splat!==undefined?`${info.splat}`:" "))
  ),
  transports: [
    // colorize the output to the console
    new (winston.transports.Console)({
      colorize: true,
      timestamp: true,
      level: "info"
    }),
    new (require('winston-daily-rotate-file'))({
      filename: `${logDir}/-results.log`,
      datePattern: 'DD-MM-YYYY',
      prepend: true,
      level: "info",
      timestamp : function() {
        return getDateTime();        
      }
    })
  ]
});


const errorLogger = new (winston.createLogger)({
  transports: [
    // colorize the output to the console
    new (winston.transports.Console)({
      colorize: true,
      timestamp: true,
      level: "error"
    }),
    new (require('winston-daily-rotate-file'))({
      filename: `${logDir}/-error.log`,
      datePattern: 'DD-MM-YYYY',
      prepend: true,
      level: "error",
      timestamp : function() {
        return getDateTime();        
      }
    })
  ]
});

function getDateTime(){
  var currentdate = new Date(); 
  var datetime = currentdate.getDate() + "/"
    + (currentdate.getMonth()+1)  + "/" 
    + currentdate.getFullYear() + " "  
    + currentdate.getHours() + ":"  
    + currentdate.getMinutes() + ":" 
    + currentdate.getSeconds();
  return datetime;  
}

function formatArgs(args){
  return [util.format.apply(util.format, Array.prototype.slice.call(args))];
}

console.log = function(){
    infoLogger.info.apply(infoLogger, formatArgs(arguments));
};

console.error = function(){
  errorLogger.error.apply(errorLogger, formatArgs(arguments));
};


module.exports = {
  infoLogger,
  errorLogger
};