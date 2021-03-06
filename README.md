## fish-request

fish-request 是一个基于 promise 的 uni-app 网络请求库

## 特性

-   API 类似于 axios
-   基于 promise
-   请求和响应拦截
-   阻塞请求
-   创建实例

## 安装

```
npm install --save fish-request
```

```
yarn add fish-request
```

## 例子

### 引入：

```
import http from 'fish-request'
```

### 设置请求默认值：

```
http.default.baseURL = "https://www.example.com/request/";
http.default.header["content-type"] = "application/x-www-form-urlencoded";
http.default.success = ()=>{
    console.log('success)
}
```

http.default 中的 baseURL 属性会被拼接到每次请求的 url 之前，其他可以设置的属性与 [uni.request](https://uniapp.dcloud.io/api/request/request) 的参数相同。

### 发送请求：

```
http({
    url: 'https://www.example.com/request',
    method:'GET',
    data: {
        text: 'uni.request'
    }
})
.then(function (response) {
    console.log(response);
})
.catch(function (error) {
    console.log(error);
})
```

参数同 [uni.request](https://uniapp.dcloud.io/api/request/request) ，参数中与 default 相同的属性，header 会合并，success/fail/complete 会依次执行，其他会覆盖。

### 请求别名:

```
http.get(url[, config])
http.post(url[, data[, config]])
```

### 阻塞请求:

```
http.default.baseURL = "https://www.example.com/request/";
http.turnOff();
http.post('getToken',{},{ greenLight: true })
.then((token)=>{
    http.default.header.access_token = token;
    http.turnOn();
})
http.post('getPersonalData',{id:1})
```

调用 `turnOff` 方法，后续所有的请求都会被阻塞，直到调用 `turnOn` 方法，请求才会一起发送。可以设置参数 `greenLight:true` ,使此请求不被阻塞。

上例中 getPersonalData 的请求会等到 token 设置好之后才发出。

### 拦截器:

```
// 请求拦截
http.interceptors.request.use(request => {
    // 设置loading
    uni.showLoading();
    request.complete = uni.hideLoading;
    return request;
});
// 响应拦截
http.interceptors.response.use(response => {
    if (response.statusCode === 200) {
        return data;
    } else if (response.statusCode === 500) {
        // do something
    } else {
        throw "网络错误";
    }
});
```

### 创建实例:

```
const request = fist.create({
    url: "https://www.example.com/request/",
    timeout: 1000,
    header:{
        'content-type':'application/x-www-form-urlencoded'
    }
})
request.default.header["version"] = "1.0.0";
request.post('getPersonalData',{id:1})
```

_参数的合并同 default 合并单独请求，优先级 ： 实列参数 < default 参数 < 请求参数._

create 方法接收的参数也可以是函数或异步函数：

```
http.create(async ()=>{})
```
