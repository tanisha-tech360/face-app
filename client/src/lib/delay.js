export default function delay(millis) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, millis);
    })
}