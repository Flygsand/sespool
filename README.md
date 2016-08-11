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

Responses are paginated (default and maximum 100 entries per page, which can be adjusted through the request parameter `perPage`) via the [Link](https://tools.ietf.org/html/rfc5988) header. For example:

```bash
$ curl -I "http://sespool/bouncing"
Link: <http://sespool/bouncing?page=2>; rel="next", <http://sespool/bouncing?page=5>; rel="last"

$ curl -I "http://sespool/bouncing?page=3"
Link: <http://sespool/bouncing?page=1>; rel="first", <http://sespool/bouncing?page=2>; rel="prev", <http://sespool/bouncing?page=4>; rel="next", <http://sespool/bouncing?page=5>; rel="last"
```
