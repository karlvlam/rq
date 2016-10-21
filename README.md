# rq
requeue message by using AMQP


## Example

pop 10 messages from "myqueue" of myrabbitmq.local:5672/vhost, and push it back to the queue.
```bash
node rq.js user:password@myrabbitmq.local:5672/vhost myqueue 10

```

