import * as faceapi from 'face-api.js'
import webUrl from './webUrl.js'

function urlToImage(url, crossOrigin = false) {
    return new Promise((resolve, reject)=>{
        const image = new Image()
        if (crossOrigin) 
            image.crossOrigin = 'anomymous'
        image.src = url
        image.onload = () => resolve(image)
        image.onerror = reject
    })
}

export default async function faceSimilarity(knownImageUrl, unknownImageDataUrl) {
    await faceapi.loadTinyFaceDetectorModel(`${webUrl}models`) // /tiny_face_detector_model-shard1
    await faceapi.loadFaceLandmarkModel(`${webUrl}models`) // /face_landmark_68_model-shard1
    const faceDetectOptions = new faceapi.TinyFaceDetectorOptions({})
    const knownImage = await urlToImage(knownImageUrl, true)
    const unknownImage = await urlToImage(unknownImageDataUrl)
    const detection1 = faceapi.detectAllFaces(knownImage, faceDetectOptions).withFaceLandmarks().withFaceDescriptors();
    const detection2 = faceapi.detectAllFaces(unknownImage, faceDetectOptions).withFaceLandmarks().withFaceDescriptors();
    const distance = faceapi.euclideanDistance(detection1, detection2);
    return distance >= 0 && distance <= 0.4;
}
const image ="http://image-api-8265.herokuapp.com/fMYZUAVH5d3LBAh1sZ3d"
