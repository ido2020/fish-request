export const paramsMerge = (target, ...sources) => {
    if (!sources.length) return target;
    sources.forEach(item => {
        for (const key of Object.keys(item)) {
            if (key === "header") {
                target.header = target.header || {};
                Object.assign(target.header, item.header);
            } else if (key === "success" || key === "fail" || key === "complete") {
                const targetFn = target[key];
                if (targetFn)
                    target[key] = (...arg) => {
                        targetFn.apply(null, arg);
                        item[key].apply(null, arg);
                    };
                else target[key] = item[key];
            } else {
                target[key] = item[key];
            }
        }
    });
    return target;
};
