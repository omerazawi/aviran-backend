const indexR = require('./indexR');
const ScheduleR = require('./ScheduleR');

exports.routesInit = (app) =>{
    app.use('/', indexR);
    app.use('/Schedule', ScheduleR);

}