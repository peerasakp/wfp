
const composer = (middlewares) => {
    return async (req, res, next) => {
        let index = 0;

        const run = async (err) => {
            if (err) return next(err)
            const fn = middlewares[index++];
            if (!fn) return;
            await fn(req, res, run);
        };

        await run();    
    };
};

module.exports = { composer }