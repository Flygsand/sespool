# sespool /ˈsɛspuːl/

Dead simple SES bounce management.

## Usage
sespool consists of two processes, a web API and a background worker. The worker polls SQS (`QUEUE_URL`) for SES notifications and writes them to database (`DATABASE_URL`). For this to work, SES bounces and deliveries must be wired to SQS via SNS ([AWS Docs](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/notifications.html)).


### HTTP API

#### GET /bouncing

Returns bouncing recipients, along with information about the last recorded bounce.

```json
[
  {
    "address": "bounce@simulator.amazonses.com",
    "type": "Permanent",
    "subType": "General",
    "timestamp": "2016-05-17T13:27:02.000Z"
  },
  {
    "address": "john@example.com",
    "type": "Transient",
    "subType": "General",
    "timestamp": "2016-05-17T12:59:57.000Z"
  }
]
```
