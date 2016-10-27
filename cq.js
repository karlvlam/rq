/*
*
* rq: queue.push(queue.pop())
*
*
* */

var argv = process.argv;
if (argv.length < 5){
    showUsage();
    process.exit(0);
}

function showUsage(){
    var s = "\nUsage: " + argv[1] + " [Rabbit web console connection string] [queue name] [Condition count]\n"
    s += "\nExample:\n" 
    s += "\nnode cq.js http://user:password@myrabbitmq.local:15672 myqueue 10\n" 
    console.log(s);
}


var base_url = argv[2];
//var user = argv[3];
//var password = argv[4];
var queue = argv[3];
var zero_count = parseInt(argv[4]);

var failed_count = 0;




var request = require('request');


var url = base_url + '/api/queues/%2F/' + queue + '?lengths_age=600&lengths_incr=5&msg_rates_age=600&msg_rates_incr=5';

console.log(url);
var opt = {
    url: url,
    method: 'GET',
    json: true,
}

var eventEmitter = require('events');
var worker = new eventEmitter();

worker.on('getStatus', getStatus);

function getStatus(){
    request(opt, function(err, res, body){
        if (err){
            console.log(err);
            setTimeout(function(){
                worker.emit('getStatus')
            }, 1000)

            return;
        }

        detect(getInfo(body));
    })


}

function getInfo(o){
    var info = {
        ready: o.messages_ready,
        unack: o.messages_unacknowledged,
        rate: o.message_stats.deliver_details.rate,
        avg_rate: o.messages_details.avg_rate,
    }
    return info;
}

function detect(info){
    console.log(JSON.stringify(info))
    if (info.unack > 0 && info.rate < 1){
        failed_count += 1;

    }else{
        failed_count = 0;
    }


    if (failed_count >= zero_count){
        console.log('failed');
        process.exit(0);
    }
    setTimeout(function(){
        worker.emit('getStatus')
    }, 1000)
}



worker.emit('getStatus')
