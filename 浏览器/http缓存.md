## http缓存
|  请求头(Request-header)   |  响应头(Response-header)     |  
|           :--:           |             :--:            |
|                          |  expires                    |
| cache-control            |  cache-control              |
| if-modified-since        |  last-modified              |
| if-none-match            |  etag                       |


## 强缓存
服务器通过响应头`expires`向浏览器发送GMT格式的标准时间
例如 `Wed, 17 Jun 2020 10:10:40 GMT`

服务器通过响应头`cache-control`向浏览器发送，期间内使用缓存
例如 `max-age=3600`

![](https://img-blog.csdn.net/20180923144742898?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3UwMTIzNzU5MjQ=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

服务器收到
- `if-none-match`这个请求头中记录的是上次相应时该资源的`etag`值

- `is-modified-since`这个请求头中记录的是上次相应的`last-modified`的那个GMT格式的时间戳

- 如果服务器同时收到了`etag、is-modified-since、is-none-match`那么浏览器会使用`is-none-match`与服务器上新生成的`etag`进行比对，若无改变`304`

下次请求时通过`If-None-Match`或`If-Match`带上该值，服务器对该值进行对比校验：如果一致则不要返回资源。
`If-None-Match`和If-Match`的区别是：
`If-None-Match`：告诉服务器如果一致，返回状态码`304`，不一致则返回资源
`If-Match`：告诉服务器如果不一致，返回状态码`412`


`If-Modified-Since`和`If-Unmodified-Since`的区别是：
`If-Modified-Since`：告诉服务器如果时间一致，返回状态码`304`
`If-Unmodified-Since`：告诉服务器如果时间不一致，返回状态码`412`


```js
唯一地表示所请求资源的实体标签。形式是采用双引号括起来的由 ASCII 字符串（"675af34563dc-tr34"），有可能包含一个 W/ 前缀，来提示应该采用弱比较算法（可以不加这个前缀，If-None-Match 用且仅用这一算法）。
*
星号是一个特殊值，可以代表任意资源。它只用在进行资源上传时，通常是采用 PUT 方法，来检测拥有相同识别ID的资源是否已经上传过了。
```
```js
If-None-Match: "bfc13a64729c4290ef5b2c2730249c88ca92d82d"

If-None-Match: W/"67ab43", "54ed21", "7892dd"

If-None-Match: *
```