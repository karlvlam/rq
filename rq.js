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
    var s = "\nUsage: " + argv[1] + " [AMQP connection string] [Queue Name] [Requeue count]\n"
    s += "\nExample:\n" 
    s += "\nnode rq.js user:password@myrabbitmq.local:5672/vhost myqueue 10\n" 
    console.log(s);
}


var amqp = require('amqplib/callback_api');

var url = 'amqp:' + argv[2];
var queue = argv[3];
var count = parseInt(argv[4]);

var queueOpt = {
    durable: true,
    autoDelete: false,
    passive: true,
}

var subOpt= {
    ack: true,
    prefetchCount: 1,
}
var channel = null;
var connection = null;

amqp.connect(url, function(err, conn){
    if (err){
        console.log(err);
        process.exit(1);
    }

    connection = conn;
    run(conn);
})

var eventEmitter = require('events');
var worker = new eventEmitter();

worker.on('requeue', requeue);


function close(){
    channel.close(function(err){
        if (err){
            console.log(err);
            return;
        }

        console.log('Channel closed!');
        connection.close(function(err){
            if (err){
                console.log(err);
                return;
            }

            console.log('Connetion closed!');
            process.exit(0);
        })
    })
}

function requeue(){
    if (count <= 0){ 
        console.log('Job Done! Closing connection...');
        close();
        return;
    }

    channel.get(queue, {noAck: false}, function(err, res){
        if(err){
            console.log(err);
            process.exit(1);
            return;
        }
        if (!res){
            console.log('Queue is empty, exit!');
            close();
            return;
        }
        var msg = res.content;
        console.log('Message: ' + msg.toString());
        channel.sendToQueue(queue, msg, {}, function(err, res){
            if (err){
                console.log('### Message NOT acked!');
                console.log(err);
                process.exit(1);
                return;
            }
            channel.ackAll();
            console.log('## Message acked!');
            count--;
            worker.emit('requeue');
        })

    })

}


function run(conn){
    conn.createConfirmChannel(function(err, ch){
        if (err) {
            console.log(err);
            return;
        }
        channel = ch;
        ch.checkQueue(queue, function(err, q){
            if (err) {
                console.log(err);
                console.log('###############################');
                console.log('# Queue: ' + queue + " doesn't exists!");
                console.log('###############################');
                process.exit(2);
                return;
            }
            worker.emit('requeue');


        })
    })
}


