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

var cliLog, cliErrorLog, table, box, donut, screen;
var tableHeaders = ['Test file', 'Status'];

function updateTableAndStats(statuses, passCount, failCount, numCompleted, numTests, allGreen){
    var dataArray = [];
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

        row.push(testData.numPasses + ' passes', testData.numFails + ' fails');

        dataArray.push(row);
    });

    table.setData({ headers: tableHeaders, data: dataArray.reverse()});
    box.setContent(passCount + ' succesful and ' + failCount + ' failed assertions so far.');
    donut.setData([
        {
            percent: 100 - Math.ceil( (numTests - numCompleted) / numTests * 100),
            label: (numTests - numCompleted) + ' remaining ('+numTests+' total)',
            color: allGreen ? 'green' : 'red'
        }
    ]);

    _.throttle(screen.render, 500);

}


module.exports = {
    init: function () {
        var blessed = require('blessed')
            , contrib = require('blessed-contrib');

        screen = blessed.screen();


        var grid = new contrib.grid({rows: 4, cols: 2, screen: screen});

        donut = grid.set(0, 0, 1, 1, contrib.donut,
            {
                label: 'Completed tests',
                radius: 10,
                arcWidth: 3,
                spacing: 2,
                yPadding: 2,
                data: [{label: ' ', percent: 0}]
            });

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
            columnWidth: [50, 12, 12, 12]
        });


        table.focus();
        table.setData({ headers: tableHeaders, data: [['', '']]});


        screen.key(['escape', 'q', 'C-c'], function(ch, key) {
            return process.exit(0);
        });

        screen.render();
    },

    log: log,
    error: errorLog,

    update: updateTableAndStats
}