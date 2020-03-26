import { paramsMerge } from "./params-merge";

const isObject = obj => obj !== null && typeof obj === "object" && !Array.isArray(obj);
const isFunction = fn => typeof fn === "function";
const isPromise = v => typeof v.then === "function" && typeof v.catch === "function";

const _createRequest = params => {
    return new Promise((res, rej) => {
        const submitParams = paramsMerge(
            {
                success: response => res(response),
                fail: error => rej(error)
            },
            params
        );
        uni.request(submitParams);
    });
};

const instanceBaseParamsMap = {};
let instanceBaseParamsIndex = 0;

const _createInstance = objOrFn => {
    let instanceIndex = instanceBaseParamsIndex++;
    let unResolvePromise;
    let blockPromise = null;
    if (isPromise(objOrFn)) {
        unResolvePromise = objOrFn;
    } else if (isObject(objOrFn)) {
        instanceBaseParamsMap[instanceIndex] = objOrFn;
    } else if (isFunction(objOrFn)) {
        try {
            const objOrPromise = objOrFn();
            if (isPromise(objOrPromise)) {
                unResolvePromise = objOrPromise;
            } else instanceBaseParamsMap[instanceIndex] = objOrPromise;
        } catch (error) {
            console.error(error);
            instanceBaseParamsMap[instanceIndex] = {};
        }
    }
    if (unResolvePromise) {
        unResolvePromise
            .then(params => {
                instanceBaseParamsMap[instanceIndex] = params;
            })
            .catch(err => {
                console.error(err);
                instanceBaseParamsMap[instanceIndex] = {};
            });
    }
    const http = async params => {
        // 请求被阻塞
        if (blockPromise && !params.greenLight) await blockPromise;
        let result;
        let baseParams = instanceBaseParamsMap[instanceIndex];
        // 调用时创建实例的promise还未返回
        if (!baseParams) baseParams = await unResolvePromise;
        // 设置请求前缀
        if (http.default.baseURL) params.url = http.default.baseURL + params.url;
        // 合并参数
        let mergedParams = paramsMerge({}, baseParams, http.default, params);
        // 请求拦截器
        if (http._requestInterceptor) mergedParams = http._requestInterceptor(mergedParams);
        // 发送请求
        result = await _createRequest(mergedParams);
        // 响应拦截器
        if (http._responseInterceptor) result = http._responseInterceptor(result);
        return result;
    };
    http.get = (url, params) => http({ url, ...params, method: "GET" });
    http.post = (url, data, params) => http({ url, ...params, method: "POST", data });
    http.default = { header: {} };
    http.interceptors = {
        request: {
            use: fn => (http._requestInterceptor = fn)
        },
        response: {
            use: fn => (http._responseInterceptor = fn)
        }
    };
    // turnOff可以阻塞请求
    http.turnOff = () => {
        blockPromise = new Promise(res => {
            http.turnOn = () => {
                blockPromise = null;
                res();
            };
        });
    };
    return http;
};

const httpInstance = _createInstance({});
httpInstance.create = _createInstance;

export default httpInstance;
