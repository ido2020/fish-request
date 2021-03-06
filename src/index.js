import { paramsMerge } from "./params-merge";

const isObject = (obj) => obj !== null && typeof obj === "object" && !Array.isArray(obj);
const isFunction = (fn) => typeof fn === "function";
const isPromise = (v) => typeof v.then === "function" && typeof v.catch === "function";

const _createRequest = (params) => {
    return new Promise((res, rej) => {
        const submitParams = paramsMerge(
            {
                success: (response) => res(response),
                fail: (error) => rej(error),
            },
            params
        );
        uni.request(submitParams);
    });
};

const instanceBaseParamsMap = {};
let instanceBaseParamsIndex = 0;

let sendingLenght = 0;

const _createInstance = (objOrFn) => {
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
            .then((params) => {
                instanceBaseParamsMap[instanceIndex] = params;
            })
            .catch((err) => {
                console.error(err);
                instanceBaseParamsMap[instanceIndex] = {};
            });
    }
    const http = async (params = {}) => {
        if (blockPromise && !params.greenLight) await blockPromise;
        if (!params.url) return;
        let result;
        let baseParams = instanceBaseParamsMap[instanceIndex];
        if (!baseParams) baseParams = await unResolvePromise;
        if (http.default.baseURL) params.url = http.default.baseURL + params.url;
        let mergedParams = paramsMerge({}, baseParams, http.default, params);
        if (http._requestInterceptor) mergedParams = http._requestInterceptor(mergedParams);
        const request = _createRequest(mergedParams);
        try {
            sendingLenght++;
            result = await request;
        } catch (error) {
            throw error;
        } finally {
            sendingLenght--;
        }
        if (http._responseInterceptor) result = http._responseInterceptor(result);
        return result;
    };
    http.get = (url, params) => http({ url, ...params, method: "GET" });
    http.post = (url, data, params) => http({ url, ...params, method: "POST", data });
    http.default = { header: {} };
    http.interceptors = {
        request: {
            use: (fn) => (http._requestInterceptor = fn),
        },
        response: {
            use: (fn) => (http._responseInterceptor = fn),
        },
    };
    http.turnOff = () => {
        blockPromise = new Promise((res) => {
            http.turnOn = () => {
                blockPromise = null;
                res();
            };
        });
    };
    http.getSendingLenght = () => sendingLenght;
    return http;
};

const httpInstance = _createInstance({});
httpInstance.create = _createInstance;

export default httpInstance;
