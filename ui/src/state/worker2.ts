
const init = async() => {
    postMessage('ready')
}
init()

onmessage = (e) => {
    console.log(e)
}