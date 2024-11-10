class HttpError extends Error {
    response: { status: number; };
    constructor(public status: number, public message: string) {
        super(message);
        this.response = {
            status: status
        };
        this.name = 'HttpError';
    }
}

export {
    HttpError
};