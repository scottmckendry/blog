---
title: "We're at Zero, and One is a Thousand Years Away"
date: 2026-06-01
tags: ["programming", "existential-dread"]
summary: "The very patient wait for the first digit to change"
---

UUIDs - Universally Unique Identifiers - play a key role in modern computing systems.

I've never stopped and thought about this beyond whether to use v4 or v7 (more on that below). However, just a few days ago I came across this [Hacker News post](https://news.ycombinator.com/item?id=48061235):

> Funny story no one will believe, but it's true. A good friend of mine joined a startup as CTO 10 years ago, high growth phase, maybe 200 devs... In his first week he discovered the company had a microservice for generating new UUIDs. One endpoint with its own dedicated team of 3 engineers ...including a database guy (the plot thickens). Other teams were instructed to call this service every time they needed a new 'safe' UUID. My pal asked wtf. It turned out this service had its own DB to store every previously issued UUID. Requests were handled as follows: it would generate a UUID, then 'validate' it by checking its own database to ensure the newly generated UUID didn't match any previously generated UUIDs, then insert it, then return it to the client. Peace of mind I guess. The team had its own kanban board and sprints.

Even if you don't have a rudimentary understanding of how UUIDs work, keeping a record of something that, by its namesake, is universally unique, is not the most excellent use of time and resources.

Well it got me thinking about probabilities of collision and potential use cases where something like this might be warranted (there are none, don't waste your time) and eventually I moved on to the ordering properties of UUIDv7.

For the uninitiated, **UUIDv7** ([RFC 9562](https://datatracker.ietf.org/doc/html/rfc9562)) is shaped much like a conventional **UUIDv4**. However the first 12 hex characters (48 bits) are reserved for a Unix timestamp in milliseconds. Let's generate a couple as an example:

```shellsession
$ uuidgen -7; sleep 2; uuidgen -7
019e8051-0563-7103-83f1-6f3403f2cff3
019e8051-0d4a-7bb6-8fe0-d6c703dccdc8
```

Now, we can use another small script to see the embedded timestamps:

```shellsession
$ uuid=$(uuidgen -7)
$ hex="${uuid:0:8}${uuid:9:4}"
$ ts_ms=$((16#$hex))
$ echo "$uuid -> $ts_ms ms ($(date -d @$((ts_ms/1000)) -u '+%Y-%m-%dT%H:%M:%S').$((ts_ms%1000))Z)"
019e8051-0563-7103-83f1-6f3403f2cff3 -> 1780269253987 ms (2026-05-31T23:14:13.987Z)
```

Now, you may have spotted what I spotted straight away - they both look very similar! This is what allows them to be ordered in a database, especially useful for primary keys where sequential data is critical.

Most important to my point, they both start with the same character `0`. Which, in turn made me wonder, when will we see the first `1`?

Let's do the maths real quick. The first hex digit covers bits **44-47** of the _48-bit timestamp_. That [nibble](https://en.wikipedia.org/wiki/Nibble) ticks over when the timestamp hits **2^44 ms**:

```python
# first, how many years from epoch is 2^44 ms?
print(2**44 / 1000 / 86400 / 365.2425)
# 557.5

# now add that to 1970 (epoch) to get the year
print(1970 + 557.5)
# 2527.5
```

Well, looks like I'll be well over 500 in the year 2527 by the time we see that first digit tick over - can't wait! Alternatively, one might wonder when we'll see an `F` as the first hex digit. That takes a bit longer:

```python
# for the nibble to reach F, timestamp must hit 15 * 2^44 ms
print(15 * 2**44 / 1000 / 86400 / 365.2425)
# 8362.1

# what about the full 48-bit overflow?
print(2**48 / 1000 / 86400 / 365.2425)
# 8919.6
```

First `F` arrives around year 10332, and the full 48-bit timestamp field overflows around year 10890. Plenty of time.

There you go! With ~1.89e22 unique UUIDv7 values available per millisecond, we can generate ordered UUIDs for the next 8,000+ years without a hint of concern. The timestamp field won't overflow for nearly 9,000 years. Plenty of runway.

To put that in perspective: every person on Earth could generate **~2.4 trillion UUIDs every single millisecond**, or every star in the observable universe could claim **~27 trillion of them**, and you'd still have barely scratched the total space before the timestamp ticks over.

![img](/img/zero-and-one/tricked.webp)
