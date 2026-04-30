/*
Small async timing helper for registration flows.
*/

export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
