var _ = require('lodash');

function logWithLogger(args, logger){
    _.toArray(args).forEach(function (arg) {
        var lines = arg.split('\n');
        logger.log(_.head(lines));
        _.tail(lines).forEach(function (line) {
            logger.log('  ' + line);
        });
    });
}

function log(){
    logWithLogger(arguments, cliLog);
}

function errorLog(){
    logWithLogger(arguments, cliErrorLog);
}

var cliLog, cliErrorLog, table, box, gauge, screen, confirmation;
var tableHeaders = ['Test file', 'Status'];

function updateTableAndStats(statuses, passCount, failCount, numSucceeded, numFailed, numTests){
    var dataArray = [];
    var nowDate = new Date().getTime();
    _.forEach(statuses, function(testData, fileName) {
        var status = testData.testStatus;
        var row = [];
        if(status === 'PENDING'){
            row = [fileName.blue, status.blue];
        } else if (status === 'RUNNING') {
            row = [fileName.yellow, status.yellow];
        } else if (status === 'SUCCESS') {
            row = [fileName.green, status.green];
        } else if (status === 'FAIL') {
            row = [fileName.red, status.red];
        } else {
            row = [fileName, status];
        }

        if(status === 'PENDING'){
            row.push('');
        } else {
            row.push(((testData.endTime === Infinity ? nowDate : testData.endTime) - testData.startedTime)/1000 + 's');
        }

        row.push(testData.numPasses + ' passes', testData.numFails + ' fails');

        dataArray.push(row);
    });

    table.setData({ headers: tableHeaders, data: dataArray.reverse()});
    box.setContent(passCount + ' successful and ' + failCount + ' failed assertions so far.');
    gauge.setStack([{percent: Math.ceil(  numSucceeded / numTests * 100), stroke: 'green'}, {percent: Math.ceil( numFailed / numTests * 100), stroke: 'red'}]);

    _.throttle(screen.render, 500);

}


module.exports = {
    init: function () {
        var dashboard = this;
        var blessed = require('blessed')
            , contrib = require('blessed-contrib');

        screen = blessed.screen();


        var grid = new contrib.grid({rows: 4, cols: 2, screen: screen});

        gauge = grid.set(0, 0, 1, 1, contrib.gauge,
            {
                label: 'Completed tests'
            });
        gauge.setStack([0,0]);

        box = grid.set(1, 0, 1, 1, blessed.box, {
            content: ' '
        });

        cliLog = grid.set(2, 0, 2, 1, contrib.log, {
            fg: "green",
            label: 'Output',
            height: "50%",
            tags: true,
            border: {type: "line", fg: "cyan"} });

        cliErrorLog = grid.set(2, 1, 2, 1, contrib.log, {
            fg: "green",
            label: 'Error Log',
            height: "50%",
            tags: true,
            border: {type: "line", fg: "cyan"} });

        table = grid.set(0,1,2,1, contrib.table, {
            keys: true,
            fg: 'white',
            selectedFg: 'white',
            selectedBg: 'blue',
            interactive: true,
            label: 'Test summary',
            width: '100%',
            height: '100%',
            border: {type: "line", fg: "cyan"},
            columnSpacing: 2,
            columnWidth: [50, 12, 12, 12, 12]
        });


        table.focus();
        table.setData({ headers: tableHeaders, data: [['', '']]});


        confirmation = blessed.message({
            top: 'center',
            left: 'center',
            width: 'shrink',
            height: 'shrink',
            tags: true,
            hidden: true,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                bg: 'magenta',
                border: {
                    fg: '#f0f0f0'
                },
                hover: {
                    bg: 'green'
                }
            }
        });

        screen.append(confirmation);

        screen.key(['r'], function(ch, key) {
            if (dashboard.report) dashboard.report();
        });
        screen.key(['escape', 'q', 'C-c'], function(ch, key) {
            return process.exit(0);
        });



        screen.render();
    },

    log: log,
    error: errorLog,

    update: updateTableAndStats,

    finish: function (isReportEnabled) {
        var reportHint = isReportEnabled ? ' Hit r to view the report.' : '';
        confirmation.display('All tests have completed. Hit enter to dismiss this message.' + reportHint + ' Hit q or C-c to quit.', 0);
        confirmation.focus();
        screen.render();
    }
};