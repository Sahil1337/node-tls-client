| Scenario | 2.1.0 | 2.2.0 | 2.2.0 + node-tls-client binary | node-fetch 2.7.0 |
| --- | ---: | ---: | ---: | ---: |
| 1 in flight, 50 ms server: requests/s | 19 req/s | 19 req/s | 19 req/s | 19 req/s |
| 16 in flight, 50 ms server: requests/s | 305 req/s | 309 req/s | 306 req/s | 309 req/s |
| 64 in flight, 50 ms server: requests/s | 377 req/s | 385 req/s | 1,207 req/s | 1,228 req/s |
| 256 in flight, 50 ms server: requests/s | 383 req/s | 385 req/s | 4,735 req/s | 4,597 req/s |
| 1,024 in flight, 50 ms server: requests/s | 383 req/s | 384 req/s | 15,432 req/s | 14,339 req/s |
| 5,000 at once, 50 ms server: time to finish | 13.1 s | 13.0 s | 0.26 s | 0.43 s |
| 5,000 at once, 50 ms server: peak memory | 468 MB | 131 MB | 349 MB | 278 MB |
| 16 in flight, 50 ms server: CPU per request | 9,833 µs | 564 µs | 496 µs | 418 µs |
| 64 in flight, 50 ms server: CPU per request | 1,327 µs | 494 µs | 314 µs | 235 µs |
| 64 in flight, 50 ms server: peak memory | 372 MB | 86 MB | 89 MB | 84 MB |
| One at a time, instant server: median latency | 1.5 ms | 1.4 ms | 1.5 ms | 1.4 ms |
| 64 in flight, instant server: requests/s | 10,068 req/s | 10,302 req/s | 31,343 req/s | 29,790 req/s |
| 64 in flight, instant server: CPU per request | 364 µs | 240 µs | 125 µs | 47 µs |
| HTTPS (HTTP/1.1), 64 in flight, 50 ms server: requests/s | 383 req/s | 382 req/s | 1,219 req/s | 1,226 req/s |
| HTTPS (HTTP/1.1), 2,000 at once, 50 ms server: time to finish | 5.21 s | 5.20 s | 0.47 s | 8.08 s (401 of 6,000 requests failed) |
| HTTPS (HTTP/2), 64 in flight, 50 ms server: requests/s | 378 req/s | 382 req/s | 1,202 req/s | not supported |
| HTTPS (HTTP/2), 2,000 at once, 50 ms server: time to finish | 5.26 s | 5.21 s | 0.10 s | not supported |
